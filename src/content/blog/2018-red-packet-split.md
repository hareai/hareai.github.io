---
title: 红包分配问题
date: 2018-09-22T19:23:54+08:00
description: ""
category: tech
badge: Article
slug: red-packet-split
---

> 问题：一共有100块钱，要分给10个人，最大的12，最小的6，设计一个发红包的方法

晚上在水群里，看到有讨论到这个问题的，所以当时就随便写了下，现在重新整理下。

 <!-- more -->

### 开始思路

**红包发一个，总钱数减一个红包的钱，保证随机红包钱在[6,12]之间，减掉后的总钱数要大于剩下的人数x6，遍历一遍后，有多余的钱用递归对每个人循环补，直到剩下的钱补完**

``` javascript 
let sum = 100
let num = 10
const min = 6
const max = 12
let result = []
const fn = () => {
  // 随机红包数
  const randomNum = () => Math.floor(Math.random() * (max - min + 1) + min)
  while (num--) {
    while (1) {
      const red = randomNum()
      if (sum - red > num * min) {
        sum -= red
        result.push(red)
        break
      }
    }
  }

  // 还有钱没发完
  if (sum > 0) {
    const step = 1
    remainFn = money => {
      if (money !== 0) {
        result = result.map(value => {
          if (value + step <= max && money > 0) {
            money = money - step
            return value + step
          }
          return value
        })

        remainFn(money)
      }
    }

    remainFn(sum)
  }
}

fn()
console.log(result)

// result
[12,12,7,12,11,9,7,10,12,8]
```

这个思路有问题：
* 会出现死循环的情况，即：**前面钱发多了，后面不够分**
* 只能运行在红包钱数是整数的情况下

### 改进思路
> 最小的是6，每个人先预先分配6，剩下的再进行遍历分配，这样只要保证总钱数在[60,120]之间就可以把剩余的钱减完，调整精度，红包钱数精度到分。

``` javascript
let num = 10
let sum = 100
const min = 6
const max = 12

let result = []

// 精度
const precision = 2

// 浮点数加法
const add = (firstNum, secondNum) => {
  const factor = Math.pow(10, precision)
  return (
    (Math.round(firstNum * factor) + Math.round(secondNum * factor)) /
    factor
  ).toFixed(precision)
}

// 浮点数减法
const reduce = (firstNum, secondNum) => {
  const factor = Math.pow(10, precision)
  return (
    (Math.round(firstNum * factor) - Math.round(secondNum * factor)) /
    factor
  ).toFixed(precision)
}

const fn = () => {
  if (sum > max * num || sum < min * num) return []

  // 每个人先分配6块钱
  sum = sum - min * num
  for (let i = 0; i < num; i++) {
    result.push(min)
  }

  // 递归将剩下的分配出去
  const remainFn = money => {
    let i = 0
    let remain = 0
    for (; i < num; i++) {
      if (money > 0) {
        // 随机补的钱数
        const red = Math.random().toFixed(precision)
        // 剩余钱数
        remain = reduce(money, red)
        if (remain < 0) {
          result[i] = add(result[i], money)
          break
        } else {
          money = remain
          result[i] = add(result[i], red)
        }
      }
    }

    // 循环后还有剩余的，执行递归
    if (remain > 0) {
      remainFn(remain)
    }
  }

  remainFn(sum)
}

fn()
console.log(result)
console.log(result.reduce((v, s) => { return add(v, s)}))

// result
["9.39","11.32","9.92","9.89","9.54","10.76","9.35","8.89","10.03","10.91"]
100.00
```

### 补充

实际情况中：
1. 不应该使用递归的方式进行补钱，应该根据实际需求确定复杂度
2. 在遍历若干遍后，应该手动将剩下的钱进行分配