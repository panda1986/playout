# playout
video play outstream contol

## techinal term
专业术语

* 播控 playout, 简称bpo
* 账户 account
* 素材 resource
* 分类 category
* 节目单 guide ??

### get_menu_list

* api: /account/get_menu_list
* method: GET
* params: m_type, string, "0"--获取目录菜单; "1"-获取素材分类; "2"-获取频道分类
* response

```
{
  "code": 0,
  "data": [
    {
      "status": 1,
      "need_verify": 0,
      "id": 7,
      "name": "电视剧",
      "level": 2,
      "url": "/",
      "selected": true,
      "parent_id": 2,
      "desc": "轮播系统默认素材分类",
      "order": 99,
      "wf_id": 2,
      "child_menu": [
        {
          "status": 1,
          "need_verify": 0,
          "id": 40,
          "name": "港剧",
          "level": 3,
          "url": "/",
          "selected": true,
          "parent_id": 7,
          "desc": "",
          "order": 0,
          "wf_id": 3,
          "child_menu": [
            {
              "status": 1,
              "need_verify": 0,
              "id": 41,
              "name": "古装",
              "level": 4,
              "url": "/",
              "selected": true,
              "parent_id": 40,
              "desc": "",
              "order": 0,
              "wf_id": 4
            }
          ]
        }
      ]
    }
  ],
  "server": 63576
}
```


