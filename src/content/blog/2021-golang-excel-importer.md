---
title: Golang批量导入Excel小工具
date: 2021-05-12T19:33:33+08:00
description: ""
category: tech
badge: Article
slug: golang-excel-importer
---

> 需求：批量导入excel的数据到mongodb和mysql。

最近的工作都是用Go开发，为了方便同事修改，所以用Go写了一下。OK.

随便取个名字，就叫 ```ecc``` 吧，代码目录结构如下：

```
.
|-- cmd
|   `-- ecc.go
|-- configs
|   |-- cfg.go
|   `-- cfg.yaml
|-- data
|-- internal
|   `-- importing
|-- pkg
|   |-- files
|   |-- mongo
|   `-- mysql
|-- tools
|    `-- print.go
|-- go.mod
|-- go.sum
|-- LICENSE
|-- README.en.md
`-- README.md
```

<!--more-->


### ecc.go

cli命令行工具用的是 [github.com/urfave/cli/v2](github.com/urfave/cli/v2) 。

参数：`dir`，即需要导入excel的目录。

``` Go
func main() {
	var err error
	var model string
	dir := DirPath
	app := &cli.App{
		Name:  "Ecc",
		Usage: "Ecc is a tools for batch processing of excel data",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:        "model",
				Aliases:     []string{"m"},
				Usage:       "The model of searching",
				Value:       "model",
				Destination: &model,
			},
			&cli.StringFlag{
				Name:        "dir",
				Aliases:     []string{"d"},
				Usage:       "Folder location of data files",
				Destination: &dir,
				Value:       DirPath,
			},
		},
		Action: func(c *cli.Context) error {
			importing.Load("../configs/cfg.yaml")
			importing.Handle(dir)
			return nil
		},
	}

	err = app.Run(os.Args)
	if err != nil {
		log.Fatal(err)
	}
}
```

Flags是参数配置，Action是具体执行的函数，先要去加载一下数据库的配置。

目前只用到了mysql和mongodb，~~redis做缓存的~~。

### cfg.go

``` Go
type Config struct {
	Env   string `yaml:"env"`
	Mongo struct {
		DNS        string `yaml:"dns"`
		Db         string `yaml:"db"`
		Collection string `yaml:"collection"`
	} `yaml:"mongo"`
	Mysql struct {
		Alias string `yaml:"alias"`
		Dns   string `yaml:"dns"`
	} `yaml:"mysql"`
}

```

读取配置文件用的 [github.com/spf13/viper](github.com/spf13/viper) 库。

比较核心的就是`importing.Handle()`方法，通常思路是:

**如果不校验数据，直接一个文件开一个goroutine去读，然后读完了到另一个goroutine里面去写，或者也可以读一行就写入一行**。

：`需要在每一次操作时候都要校验整个文件夹里的所有excle数据正确性，如果有错误的话就停止导入`。

所以有两种选择:
1. **要么边读边写有错误就回滚数据，终止所有goroutine**
2. **要么一次性读到一个map里，没有错误了，再写入数据库**

结合实际情况，我选择一次性读完所有数据再写入，因为：
1. 数据量本身并不算大
2. 实际上的数据源（爬来的数据...）格式出错的可能性非常大

### handle()

``` Go
var (
	rWait   = true
	wWait   = true
	rDone   = make(chan struct{})
	rCrash  = make(chan struct{})
	wDone   = make(chan struct{})
	wCrash  = make(chan struct{})
	once    = &sync.Once{}
	wg      = &sync.WaitGroup{}
        // command-line progress bar
	pb      = mpb.New(mpb.WithWaitGroup(wg), mpb.WithWidth(ProcessBarWidth)) 
)

...

func Handle(dir string) {
	var err error
	var f []os.FileInfo
	var data = &sync.Map{}

	if f, err = files.ReadDir(dir); err != nil {
		abort("-> Failure: " + err.Error())
		return
	}

	read(f, dir, data)
	for rWait {
		select {
		case <-rCrash:
			abort("-> Failure")
			return
		case <-rDone:
			rWait = false
		}
	}

	write2mongo(data)
	for wWait {
		select {
		case <-wCrash:
			abort("-> Failure")
			return
		case <-wDone:
			wWait = false
		}
	}

	pb.Wait()

	tools.Yellow("-> Whether to sync data to mysql? (y/n)")
	if !tools.Scan("aborted") {
		return
	} else {
		tools.Yellow("-> Syncing data to mysql...")
		if err = write2mysql(); err != nil {
			tools.Red("-> Failure：" + err.Error())
		} else {
			tools.Green("-> Success.")
		}
	}
}

```

这里：`rCrash`表示校验数据发现错误，用这个信号量终止全部在读的goroutine，`rDone`表示读完所有数据，结束死循环。

写的话是同样的同理。

### read()

``` Go
func read(fs []os.FileInfo, dir string, data *sync.Map) {
	for _, file := range fs {
		fileName := file.Name()
		_ext := filepath.Ext(fileName)
		if Include(strings.Split(Exts, ","), _ext) {
			wg.Add(1)
			inCh := make(chan File)
			go func() {
				defer wg.Done()
				select {
				case <-rCrash:
					return // exit
				case f := <-inCh:
					e, preData := ReadExcel(f.FilePath, f.FileName, pb)
					if e != nil {
						tools.Red("%v", e)
						once.Do(func() {
							close(rCrash)
						})
						return
					}
					data.Store(f.FileName, preData)
				}
			}()
			go func() {
				inCh <- File{
					FileName: fileName,
					FilePath: dir + string(os.PathSeparator) + fileName,
				}
			}()
		}
	}

	go func() {
		wg.Wait()
		close(rDone)
	}()
}
```

其实就是把文件信息放到`inCh`里，然后在goroutine里使用`ReadExcel()`函数去校验和处理，错了关闭`rCrash`信号量结束其他的goroutine，没问题就存在`sync.Map{}`里。

具体读excel用的是 [github.com/xuri/excelize/v2](github.com/xuri/excelize/v2) 库，代码如下：

### read_excel()
``` Go
func ReadExcel(filePath, fileName string, pb *mpb.Progress) (err error, pre *ExcelPre) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return err, nil
	}

	defer func() {
		if _e := f.Close(); _e != nil {
			fmt.Printf("%s: %v.\n\n", filePath, _e)
		}
	}()

	// Get the first sheet.
	firstSheet := f.WorkBook.Sheets.Sheet[0].Name
	rows, err := f.GetRows(firstSheet)
	lRows := len(rows)

	if lRows < 2 {
		lRows = 2
	}

	rb := ReadBar(lRows, filePath, pb)
	wb := WriteBar(lRows-2, filePath, rb, pb)

	// The first line is the field name.
	var fields []string

	// The data of the file.
	var data [][]string

	InCr := func(start time.Time) {
		rb.Increment()
		rb.DecoratorEwmaUpdate(time.Since(start))
	}

	for i := 0; i < lRows; i++ {
		InCr(time.Now())
		if i == 0 {
			fields = rows[i]
			for index, field := range fields {
				if isChinese := regexp.MustCompile("[\u4e00-\u9fa5]"); isChinese.MatchString(field) || field == "" {
					err = errors.New(fmt.Sprintf("%s: line 【A%d】 field 【%s】 \n", filePath, index, field) + "The first line of the file is not a valid attribute name.")
					return err, nil
				}

				// other rules
			}
			continue
		}

		if i == 1 {
			continue
		}

		data = append(data, rows[i])
	}

	return nil, &ExcelPre{
		FileName:    fileName,
		Data:        data,
		Fields:      fields,
		Prefixes:    Prefix(fileName),
		ProgressBar: wb,
	}
}
```

这个函数主要是配合命令进度条工具`ProgressBar`使用，然后就是加一些规则。规则多的话，可以定义一个接口，然后组合一下就行。

再剩下的，就是数据库的一些常规操作了，代码就不贴了。

最后，大概运行样子：

<i style="color:red">运行图，已遗失</i>

<p>
<u>
	<i style="color:Salmon">2022.1更新：需求端变得更复杂、更加自定义化，后改为在web端处理了</i>
</u>
</p>