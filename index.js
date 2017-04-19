const express = require('express')
const fsp = require('fs-promise');
const port = 5400
const fetch = require('isomorphic-fetch')

const APPID = 'wxc0c12076794e3d7b'
const APPSECRET = '3017b44112b2a05c832bc1d1f79ce7ab'

const FILENAME = 'access_token.json'

const url_token = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
var url_UnionID = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN'

const TokenController = {
     get_new_token: async() =>{
         var resp = await fetch(url_token)
         if(!resp.ok) throw 'http status:' + resp.code
         var respJson = await resp.json();
         global.tokenInfo = respJson;
         global.tokenInfo['timestamp'] = new Date().getTime()
         await fsp.writeFile(FILENAME, JSON.stringify(global.tokenInfo))
         var now =  new Date().getTime()
         var remaining = global.tokenInfo['timestamp'] + global.tokenInfo['expires_in']*1000 - now;
         global.tokenInfo['remaining'] = remaining
         return Promise.resolve(global.tokenInfo)
     },

     get_token: async() => {
        try{
            if (!global.tokenInfo){ //内存没
                if (!await fsp.exists(FILENAME)){  //文件没
                    return TokenController.get_new_token() //重新获取
                }else{
                    //内存没文件有
                    global.tokenInfo = await fsp.readJSON(FILENAME)
                }
            }

            if (global.tokenInfo && global.tokenInfo['access_token']){
                var now =  new Date().getTime()
                var remaining = global.tokenInfo['timestamp'] + global.tokenInfo['expires_in']*1000 - now;
                global.tokenInfo['remaining'] = remaining
                if ( remaining > 10*1000){
                    return Promise.resolve(global.tokenInfo)
                }
            }

            return TokenController.get_new_token()
        }catch(e){
            return Promise.reject(e)
        }
    },
    api_access_token: async (req,res) => {
        var tokendata = await TokenController.get_token()
        res.end(JSON.stringify(tokendata));

    },
    api_open_id: async (req,res) => {
        try{
            res.end('hello2');
            //var tokendata = await get_token()
        }catch(e){
            res.end('failed to get openid!')
        }
    },
    api_union_id: async (req,res) => {
        try{
            res.end('hello3');
            //var tokendata = await get_token()
        }catch(e){
            res.end('failed to get union!')
        }
    }
    
}

const webServer = () => express()
    .get('/', (req,res) => {res.end(index_html)})
    .get('/api/access_token', TokenController.api_access_token)
    .get('/api/open_id', TokenController.api_open_id)
    .get('/api/union_id', TokenController.api_union_id)
    .listen(port);

const index_html = `
<html>
<head>
    <meta charset='utf-8'>
    <link href="https://cdn.bootcss.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div id='app'>
        <script src="https://cdn.bootcss.com/es6-shim/0.35.3/es6-sham.min.js"></script>
        <script src="https://cdn.bootcss.com/fetch/2.0.3/fetch.min.js"></script>
        <script src="https://cdn.bootcss.com/vue/2.2.6/vue.min.js"></script>
        <script src="https://cdn.bootcss.com/vue-resource/1.3.1/vue-resource.min.js"></script>
        <button @click="get_access_token" class="btn btn-primary">获取access_token</button>
        <button @click="get_open_id" class="btn btn-primary">获取open_id</button>
        <button @click="get_union_id" class="btn btn-primary">获取union_id</button>
        <div style='margin:4px'>{{display}}</div>
    </div>


    <script>
        new Vue({
            el:'#app',
            data:{
                display:''
            },
            methods:{
                get_access_token: function (){
                    this.$http.get('/api/access_token').then(response => {
                        this.display = response.body 
                    }, response => {
                        console.log(response)
                    });
                },
                get_open_id: function (){
                    this.$http.get('/api/open_id').then(response => {
                        this.display = response.body 
                    }, response => {
                        console.log(response)
                    });
                },
                get_union_id: function (){
                    this.$http.get('/api/union_id').then(response => {
                        this.display = response.body 
                    }, response => {
                        console.log(response)
                    });
                },
            }
        })
    </script>
</body>
</html>
`

const main = async ()=>{
   webServer()
   console.log('http://localhost:'+port)
}

main()

/*
----DATASECTION START----
----DATASECTION END----
*/