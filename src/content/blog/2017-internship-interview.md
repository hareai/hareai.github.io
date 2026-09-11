---
title: 几个实习的面试题
date: 2017-07-26T11:47:46+08:00
description: ""
category: tech
badge: Article
slug: internship-interview
---

记几道面试题，大概9个左右，分两篇记，另外一部分已经忘记(2018.3)。

后面三道题是算法题，前面六道题是基础题，面试时候有十二道题，最后面三道题是设计算法题，具体的忘记了，不记。这九道题大致记得，也可能有误差。

### 1.静态方法与魔术常量

```php
class A {
    public static function say() {
        echo __CLASS__ ;
    }
}

class B extends A {
    public static function say() {
        echo __CLASS__ ;
    }
    public static function toSay() {
        A::say();
        parent::say();
        self::say();
    }
}

class C extends B {
    public static function say() {
        echo __CLASS__ ;
    }
}

(new C)::toSay();
```

大概长这样子的。不注意，脑子一抽，下意识地就会填ABC，再想想，这是个坑，静态方法是属于类本身的，是先于对象的存在。所以答案是：**AAB**。

### 2.指针的应用

```php
<?php
$arr = [2,3,4];
foreach ($arr as $key => $value) {
    var_dump(current($arr));
}

$arr = [2,3,4];
foreach ($arr as $value) {
    var_dump(current($arr));
}

$arr = [2,3,4];
$b = &$arr;
foreach ($arr as $key => $value) {
    var_dump(current($arr));
}
```

大概长这样子。这个题考点有两个：

- 数组指针操作函数使用

- foreach的原理

#### php的数组指针操作函数的使用

php的数组指针操作函数见文档[PHP:current](http://php.net/manual/en/function.current.php)，就几个：

- prev()

- next()

- current()

- end()

- key()

- each()

current即返回当前指针指向的元素，默认指向数组第一个元素。相比较而言，each使用的场景更多些。

```php
<?php
$arr = [2,3,4,"sb"];
var_dump(current($arr));
var_dump(next($arr));
var_dump(current($arr));
var_dump(prev($arr));
var_dump(end($arr));
var_dump(current($arr));

$arr = [2, 3, 4, 5, 6, "12", "sb", 'dd' => 'zz'];
echo each($arr)['key'] . ":" . prev($arr) . "\n";
while (list($key, $value) = each($arr)) {
    var_dump("$key : $value");
}
```

#### foreach的原理

说到foreach这东西，就离不开Iterator，说到Iterator，就离不开Collection。PHP里没有List、Set、Map之类的东西，全部用Array实现，所以有人说PHP的核心在于底层的HashTable。PHP的底层实现，我早已经不记得是个什么鬼了，有机会再写。

```php
Traversable {

}

Iterator extends Traversable {
abstract public mixed current ( void )
abstract public scalar key ( void )
abstract public void next ( void )
abstract public void rewind ( void )
abstract public boolean valid ( void )
}

IteratorAggregate extends Traversable {
abstract public Traversable getInterator ( void );
}
```

Traversable是一个内建抽象接口，无法被实现，仅用来判断类是否可以被遍历。通常是拿Iterator和IteratorAggregate做实现。[php.net](http://php.net/manual/zh/class.iterator.php)上的例子比我写的好，就截下来：

```php
<?php
class myIterator implements Iterator {
    private $position = 0;
    private $array = array(
        "firstelement",
        "secondelement",
        "lastelement",
    );

    public function __construct() {
        $this->position = 0;
    }

    function rewind() {
        var_dump(__METHOD__);
        $this->position = 0;
    }

    function current() {
        var_dump(__METHOD__);
        return $this->array[$this->position];
    }

    function key() {
        var_dump(__METHOD__);
        return $this->position;
    }

    function next() {
        var_dump(__METHOD__);
        ++$this->position;
    }

    function valid() {
        var_dump(__METHOD__);
        return isset($this->array[$this->position]);
    }
}

$it = new myIterator;

foreach($it as $key => $value) {
    var_dump($key, $value);
    echo "\n";
}
?>

//result
string(18) "myIterator::rewind"
string(17) "myIterator::valid"
string(19) "myIterator::current"
string(15) "myIterator::key"
int(0)
string(12) "firstelement"

string(16) "myIterator::next"
string(17) "myIterator::valid"
string(19) "myIterator::current"
string(15) "myIterator::key"
int(1)
string(13) "secondelement"

string(16) "myIterator::next"
string(17) "myIterator::valid"
string(19) "myIterator::current"
string(15) "myIterator::key"
int(2)
string(11) "lastelement"

string(16) "myIterator::next"
string(17) "myIterator::valid"
```

扯远了，这里不是对类进行遍历，而是对数组进行变量。而本题的重点在于**foreach遍历数组的过程中会对指针状态进行一个临时保存，也就是说，你在foreach块里面是改不了指针状态的。**写个例子：

```php
$arr = array(1,2,3,4,5);
foreach($arr as $key => &$row) {
    $row = $row *2;
    echo key($arr), '=>', current($arr), "\r\n";
    end($arr);
    echo '$key:' . $key . " => " . '$value:' .$row . "\r\n";
}
unset($row);
var_dump($arr);

//result
0=>2
$key:0 => $value:2
4=>5
$key:1 => $value:4
4=>5
$key:2 => $value:6
4=>5
$key:3 => $value:8
4=>10
$key:4 => $value:10
array(5) {
  [0]=>
  int(2)
  [1]=>
  int(4)
  [2]=>
  int(6)
  [3]=>
  int(8)
  [4]=>
  int(10)
}
```

这个例子里，可以看到，你可以对数组的值进行引用，然后改变元素的值，但是你无法改变被临时保存的指针的指向。详细的可以看[TIPI-foreach的实现](http://www.php-internals.com/book/?p=chapt16/16-01-01-php-foreach)，注意后面的**指针的意外行为**的内容，再结合面试题的第三个例子，想想面试官可能是想考察这方面内容，但是我在实际实践的过程中，并没有出现**指向第二个元素**的情况出现，这里不做深入了解。

### 3.魔术方法

第三题应该是整个面试题里最简单的一道题，就是考察你对魔术方法的**记忆**。

> 简述下列方法的使用场景：
__construct(),__destruct(),__call(),
__callStatic(),__set(),__get(),__isset(),
__unset(),__autoload(),__toString(),
__clone(),__sleep(),__wakeup()

简单的就不说了，但是还是有几个需要理解下的。

- __destruct()即析构函数，在类被释放的时候，触发的方法，通常在关闭文件，释放结果集的时候使用。

- __isset()与__unset()，平时不注意就不知道这两个是干嘛的,其实就是尝试判断或者删除变量的时候触发

- __autoload(), 这个常常记成实例化时候的自动加载，其实是尝试加载未定义的类

- __clone(),被克隆时候用

- __sleep(),__wakeup(),在序列化、反序列化的时候触发

### 4.HTTP协议

第四题应该是最难的一道题，因为如果你不是太关注HTTP协议的话你根本很难写出HTTP报文格式。

> HTTP协议有那些请求方法，有什么区别，写出请求报文与响应报文格式，写出常见的HTTP请求头与响应头字段，写出常见的响应码与对应的含义。

#### 常见6种请求方法

- GET

- PUT

- HEAD

- POST

- DELETE

- OPTIONS

GET和POST就不说了，用得最多。PUT与POST、GET的区别在于**PUT会指定资源的位置**，HTML表单也不支持这个协议，所以这个方法基本上不会被使用。HEAD仅用来判断资源是否存在，不含数据。DELETE即删除某一个资源。OPTIONS用来判断一个资源支持的请求方法。

#### 请求报文与响应报文格式

请求报文一般这个格式：

```
请求行，例如：GET /images/logo.png HTTP/1.1
请求头，例如：Accept: text/plain
空行
可选择的请求体
```

响应报文一般这个格式：

```
包含状态码的状态行，例如：HTTP/1.1 200 OK
响应头，例如：Content-Type: text/html
空行
可选择的消息体
```

这玩意得动手弄弄才记得清楚。先把本地服务器(ArchLinux)的Telnet-server给打开，socket是啥呢？可以看看[systemd.socket](http://www.jinbuguo.com/systemd/systemd.socket.html)。

```bash
systemctl start telnet.socket

netstat -nlp | grep :23
tcp6       0      0 :::23                   :::*                    LISTEN      1/systemd

//测试
telnet localhost
```

哈哈，不要问我为什么多此一举地打开服务器的telnet-server，直接本地telnet不就可以了么，因为我习惯在linux下操作，而且本地服务器是可以穿wall的。

```bash
//先连接到本地服务器
telnet lan

//连接谷狗的http
telnet www.google.com 80

//请求
GET /index.html HTTP/1.1
HOST: www.google.com

//回应
HTTP/1.1 302 Found
Location: http://www.google.com.hk/url?sa=p&hl=zh-CN&pref=hkredirect&pval=yes&q=http://www.google.com.hk/index.html%3Fgws_rd%3Dcr&ust=1501472919811303&usg=AFQjCNHkemqeUOExzBFPRxWdDKSV-FutIg
Cache-Control: private
Content-Type: text/html; charset=UTF-8
P3P: CP="This is not a P3P policy! See https://www.google.com/support/accounts/answer/151657?hl=en for more info."
Date: Mon, 31 Jul 2017 03:48:09 GMT
Server: gws
Content-Length: 400
X-XSS-Protection: 1; mode=block
X-Frame-Options: SAMEORIGIN
Set-Cookie: NID=108=gFvAS2787nuBm2FKhba2zGXv4RpYeNj3I3nXCrQ7XigPUTE-FUEh7gIdyHfG3XqLEvILb9fD2C8FFZdvXRauMQ8Js8tJ2zjc2OaGk4wT4MqsLJP-UgiG9EyBC6eqNtwx; expires=Tue, 30-Jan-2018 03:48:09 GMT; path=/; domain=.google.com; HttpOnly
```

可以看到，重定向了，再来个post的。

```bash
//请求
POST / HTTP/1.1
Accept: */*
Host: google.com
Referer: www.qq.com
Accept-Language: zh-cn
Accept-Encoding: gzip, deflate
Connection: Keep-Alive
Cache-Control: no-cache
Content-Type: application/x-www-form-urlencoded
Content-Length:12

content=good

//回应
HTTP/1.1 405 Method Not Allowed
Allow: GET, HEAD
Date: Mon, 31 Jul 2017 08:40:20 GMT
Content-Type: text/html; charset=UTF-8
Server: gws
Content-Length: 1589
X-XSS-Protection: 1; mode=block
X-Frame-Options: SAMEORIGIN
```

#### 常见HTTP的头部字段

- Accept

- Accept-Charset

- Accept-Encoding

- Accept-Language

- Cache-Control

- Content-Length

- Content-Type

- Cookie

- Date

- Expect

- ….

这特么太多了好吧？具体的见Github上人家整理的[List_of_HTTP_header_fields.xlsx](https://github.com/adtxgc/HTTP-Learning/blob/master/List_of_HTTP_header_fields.xlsx)。

#### 常见的响应码

- 200：正常状态，表示成功回应

- 301：永久重定向

- 302：临时重定向

- 304：被告知可以使用本地缓存

- 400：语法错误

- 401：未授权

- 403：资源不可用

- 404：无法访问指定路径资源

- 500：服务器意外，不能完成请求

- 502：网关错误，即服务器访问下一个服务器或者应用的时候获取了非法的回复

- 504：网关超时，代理无法完成

### 5.Web安全

这题也算简单，算是web安全的常识。

> 解释什么是会话劫持、XSS、CSRF。

- 会话劫持： 就是拿到的了cookie验证了session，获取了用户的登录状态或者其他状态。

- xss：xss分两种：

- 反射型xss：非持久化，需要欺骗用户自己去点击链接才能触发XSS代码，达到会话劫持的目的。

- 存储型xss：持续化的，一般存储在数据库或者页面里，用户一旦访问就触发。

- CSRF：即跨站点请求伪造，即用户带着源站的cookie访问了钓鱼网站，钓鱼网站会要求用户携带恶意代码访问源站。

### 6.SQL

这题考的是你对mysql的date系列函数的应用，不经常用就难记住，当时我就没记起来。

> 一个数据表里有三个字段：**id**，**app_ip**，**time**，这个表里有一个月的数据，要求按**每天统计数量**并且按数量与天数排序。

注意：这里的time是没有给数据类型的，默认认为是**timestamp**类型。这题一看就知道是考date函数的，但是关键时候掉链子，尴尬。先建个表，结构如下：

```
mysql> desc sale \G
*************************** 1. row ***************************
  Field: id
   Type: int(10)
   Null: NO
    Key: PRI
Default: NULL
  Extra: auto_increment
*************************** 2. row ***************************
  Field: app_id
   Type: int(10)
   Null: NO
    Key:
Default: 0
  Extra:
*************************** 3. row ***************************
  Field: time
   Type: timestamp
   Null: NO
    Key:
Default: CURRENT_TIMESTAMP
  Extra: on update CURRENT_TIMESTAMP
3 rows in set (0.00 sec)
```

再写个插入随机数据的小例子，随手写，怎么简单就怎么写，有一段时间没写PHP了。

```php
class InserRandomData {

    private $SaleEntity;

    public function __construct() {
        $this->SaleEntity = (new SQLConnect("sale"))->getSqlResource();
    }

    /*
    * @param Integer $min,$max
    * @param String $startTime, $endTime like: $startTime=2017/7/1 $endTime=2017/7/31
    * @param Integer $count
    */
    public function execute($count, $min, $max, $startTime, $endTime) {
        list($startYear, $startMonth, $startDay) = explode('/', $startTime);
        list($endYear, $endMonth, $endDay) = explode('/', $endTime);
        $day = round(
            (
            mktime(0, 0, 0, $endMonth, $endDay, $endYear)
            -
            mktime(0, 0, 0, $startMonth, $startDay, $startYear)
            ) / 3600 / 24) + 1;
        for ($i=0; $i < $day; $i++) {
            $countEverday = $count;
            while ($countEverday-- > 0) {
                $timeStamp = date('Y-m-d H:i:s', mktime(
                    mt_rand(0, 24),
                    mt_rand(0, 60),
                    mt_rand(0, 60),
                    $startMonth, $startDay + $i, $startYear
                    )
                );
                $app_id_count = mt_rand($min, $max);
                $sqlString =
                "insert into sale(`app_id`, `time`)
                values
                (:app_id_count, :timeStamp);";
                try {
                    $sth = $this->SaleEntity->prepare($sqlString);
                    $sth->execute([
                        ':app_id_count' => $app_id_count,
                        ':timeStamp' => $timeStamp
                        ]);
                } catch (PDOException $e) {
                    echo $e->getCode(), "\n", $e->getMessage();
                }
            }
        }
    }
}

(new InserRandomData)->execute(100, 0, 100, "2017/7/1", "2017/7/31");
```

执行之后**sale**表里多了3000条数据，但是如果是工作中需要插入一定量的假数据就不能这么直接粗暴，需要自己设计插入规则与算法，这里就不探讨了。回到正题，这里我们需要写一条**sql**语句，完成题目。哈哈，写完才发现，太简单了，不过我还是得一步步分析思路，不然下次再遇到更难点就傻逼了~

```
//1.先统计，按时间分组
select sum(`app_id`) as app_id_count, time from sale \
group by time \
order by time asc;

//2.选择月份后按照每天分组排序
 select \
 sum(`app_id`) as app_id_count, \
 date_format(`time`, '%Y%m%d') as day \
 from sale \
 where month(`time`) = '7' \
 group by day \
 order by app_id_count, day asc;

//3.最后还可以筛选数量和日期
 select \
 sum(`app_id`) as app_id_count, \
 date_format(`time`, '%Y%m%d') as day \
 from sale \
 where month(`time`) = '7' \
 group by day \
 having app_id_count > '5000' && day(`day`) > 20 \
 order by app_id_count, day asc;
```
