package main

import (
    "chnvideo.com/cloud/common/core"
    "chnvideo.com/cloud/common/mysql"
    "fmt"
    ojson "github.com/ossrs/go-oryx-lib/json"
    "log"
    "os"
    "sync"
)

type GlobalConfig struct {
    core.Config
    mysql.SqlCommonConfig
    Playout struct {
            Ums string `json:"ums_host_port"`
        } `json:"playout"`
}

func (v *GlobalConfig) Validate() (err error) {
    if err = v.Config.Validate(); err != nil {
        log.Println("config validate failed, ", err)
        return
    }
    if err = v.SqlCommonConfig.Validate(); err != nil {
        log.Println("mysql config validate failed, ", err)
        return
    }
    if len(v.Playout.Ums) == 0 {
        err = fmt.Errorf("ums addr is empty")
        log.Println(err.Error())
        return
    }
    return
}

var (
    ConfigFile string
    config     *GlobalConfig
    lock       = new(sync.RWMutex)
)

func Config() *GlobalConfig {
    lock.RLock()
    defer lock.RUnlock()
    return config
}

func ParseConfig(cfg string) (err error) {
    if cfg == "" {
        log.Fatalln("use -c to specify configuration file")
    }

    var f *os.File
    if f, err = os.Open(cfg); err != nil {
        return
    }
    defer f.Close()

    ConfigFile = cfg

    var c GlobalConfig
    if err = ojson.Unmarshal(f, &c); err != nil {
        return
    }
    if err = c.Validate(); err != nil {
        return
    }

    lock.Lock()
    defer lock.Unlock()

    config = &c

    log.Println("read config file:", cfg, "successfully")
    return
}


