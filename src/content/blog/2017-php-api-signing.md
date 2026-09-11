---
title: PHP接口加密验证
date: 2017-04-19T9:45:54+08:00
description: ""
category: tech
badge: Article
slug: php
---

最近课余，写了几个app的api，感觉有三个比较重要的地方：
1. 异常的捕获
2. 日志的完备
3. 接口的安全

前面两点在一些成熟的框架或者脚手架里有比较好的实现，接口安全主要就是接口认证的问题。

<!--more-->

## 通常使用签名验证
签名验证就是请求中加了一些有用没用的字段，组合起来后通过后台跟客户端达成共识的一个方法生成签名，服务器端就依照这个方法进行签名验证。

```
{
    data: [{},...],
    timestamp: 1501296071, //时间戳
    token: 'asfdjl52f1df1', //口令
    r_i: 'aljdajsd', //随机字符串
    // ...
    sign: '6D6D5DFB8DF6F4DD1A7C7E16C710A42E'
}

if (check($input)) {
    ...
}

```


这种的话，后台可以验证的地方就多了。

一般解开后再验证下口令以及口令的时效就行了，手上项目开发都是用这种验证方式。

## 使用rsa跟aes加密
众所周知，rsa是非对称加密的，aes是对称加密的，虽然我忘了rsa是怎么算的了，只记得e跟d...

其实大概知道aes会使用某长度的数据通过几轮参入转换来加密原始数据，而rsa就用来加密跟解密这个数据的就够了。

``` php
$curl = function ($url, $method = 'get', $data = '{}') {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    if (strtolower($method) === 'post') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json;charset=UTF-8",
        ]);
    }

    return curl_exec($ch);
};

$create_16_r_key = function () {
    $arr = range(0, 15);
    $len = sizeof($arr);

    while (-- $len) {
        $arr[$len] = mt_rand(0, 9);
    }

    return implode('', $arr);
};

$aes_encrypt_data = function ($data, $key) {
    $cipher = MCRYPT_RIJNDAEL_128;
    $mode = MCRYPT_MODE_CBC;
    $iv = "0102030405060708";

    $cip = mcrypt_encrypt($cipher, $key, $data, $mode, $iv);
    return base64_encode($cip);
};

$rsa_encrypt_password = function ($public_key, $password) {
    if (false === openssl_pkey_get_public($public_key)) {
        throw new Exception('The server public key fail.');
    }

    openssl_public_encrypt($password, $cip, $public_key);
    return base64_encode($cip);
};

function dump_exception(\Exception $e)
{
    echo $e->getMessage() . PHP_EOL;
}

set_exception_handler('dump_exception');

//随手生成一些json数据
$json = json_encode([
    'data' => array_chunk(
        array_combine(
            array_map(function ($value) {
                return (string)$value . '_k';
            },
                range(1, 10)
            ),
            range(1, 10)
        ), 3, true)
]);

//创建16位长度随机密码
$aes_16_key = $create_16_r_key();

//aes使用随机密码加密原始数据
$data = $aes_encrypt_data($json, $aes_16_key);

//获取rsa公钥
$get_public_key_url = 'http://scaffolding.1907.me/index.php?action=getPublicKey';
if (false === $public_key = $curl($get_public_key_url)) {
    throw new Exception('failed to get the public key.');
}

//使用rsa公钥加密随机密码
$rsa_encrypt = $rsa_encrypt_password($public_key, base64_encode($aes_16_key));

print_r($curl(
    'http://scaffolding.1907.me/index.php',
    'post',
    json_encode(['key' => $rsa_encrypt, 'data' => $data])
    )
);
```

服务器端解密：

``` php
$rsa_private_key = '-----BEGIN RSA PRIVATE KEY-----
MIICXwIBAAKBgQDZIMrlH6rcpPJR5+JVom5oz2KQ2zo35gcg/fBVXNrKsZSjPQ2A
amT88oB3qad+sENNCPHAnMU316jdTGQvXHtOBJwfX7K5epX1exYjkraGo5GT3xPw
tSryVr0bGb0yqb0gyFgmdVkAZhTqx2hoRc7krJ6ocVOeFITC0cmdyVym4QIDAQAB
AoGBAI1cmDxMPcWhblJ9EhKGyjNaseV1lZXHIWUNb2dkKN5Gd2s/2IZ+vnkguRsv
TWliAK8q35pzdsNAmSRbE+7x2yRg5Ue3b7aaYwjJOq5LyGteu46mR+Eg2DLJSOk8
r3amid8cFxcN4LTjCeNJ9Gq/0Jw8cMuiw3s/qcsovfJIAv5BAkEA97eTTELJEOgl
+tNNtwIHedXD6hXxQcWCp4ut4g3iM2CNFWUKHf0ypHC9h4kXmw3qqk1gzC4+8mcL
GG8L0RRUxQJBAOBjYSk1P6tzeSyUMhi4B5qVpS3nOeJ08SbCV8z0uWAD48v3uUQ7
jmA8V4+lyOC7YmxpeHx4+RHQeJ1jVfXBQ20CQQC6rki+RvJZ4GmG3ikKCuhxY6xy
Q7j99QfilfwjiIz4ZQHNpsh6Ey9QB3p9os38Vv+K+idBmHRtn0QYVM9V8Hl1AkEA
hvbfiwSvPjXfbZPZqgqO8EkQKFMK+w3xuqlsXCfalEjirF1dPxA/a9z/obRK5flv
ktvBj8THsxJcafZEzuOm5QJBAPPaUjw6bNuRgK5phh/H0ymYz0FB/XPHc1qmO3oT
DG+H0uc13wibzLhti3NoyzgyMvbnTDZxNEthUlJkgvnh3Z0=
-----END RSA PRIVATE KEY-----';

$rsa_public_key = '-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZIMrlH6rcpPJR5+JVom5oz2KQ
2zo35gcg/fBVXNrKsZSjPQ2AamT88oB3qad+sENNCPHAnMU316jdTGQvXHtOBJwf
X7K5epX1exYjkraGo5GT3xPwtSryVr0bGb0yqb0gyFgmdVkAZhTqx2hoRc7krJ6o
cVOeFITC0cmdyVym4QIDAQAB
-----END PUBLIC KEY-----';

if (isset($_GET['action']) and $_GET['action'] === 'getPublicKey') {
    echo $rsa_public_key;
    return ;
}

$input = $_POST ?: file_get_contents("php://input");
list($key, $data) = array_values(json_decode($input, true));
openssl_private_decrypt(base64_decode($key), $pass, $rsa_private_key);

//拿到aes随机密码
$pass = base64_decode($pass);
$iv = '0102030405060708';

//解密aes
$decrypted = mcrypt_decrypt(
    MCRYPT_RIJNDAEL_128,
    $pass,
    base64_decode($data),
    MCRYPT_MODE_CBC,
    $iv
);

echo $decrypted;
```

大概就是这样。