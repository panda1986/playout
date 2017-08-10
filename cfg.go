package main

import (
    "chnvideo.com/cloud/common/core"
    "chnvideo.com/cloud/common/mysql"
    "fmt"
    ojson "github.com/ossrs/go-oryx-lib/json"
    "log"
    "os"
    "sync"
    "chnvideo.com/cloud/playout/util"
    "path"
)

type GlobalConfig struct {
    core.Config
    mysql.SqlCommonConfig
    Playout struct {
        Ip string `json:"access_ip"`
        Ums string `json:"ums_host_port"`
    } `json:"playout"`
    Resources struct{
        VideoDir string `json:"video_dir"`
    } `json:"resources"`
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
    if len(v.Playout.Ip) == 0 {
        err = fmt.Errorf("access ip is empty")
        log.Println(err.Error())
        return
    }
    if len(v.Playout.Ums) == 0 {
        err = fmt.Errorf("ums addr is empty")
        log.Println(err.Error())
        return
    }
    if len(v.Resources.VideoDir) == 0 {
        err = fmt.Errorf("resources video dir is empty")
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
    return Init()
}

func Init() (err error) {
    // generate dynamic js file
    jsFile := path.Join(SystemDynamicCodeJsDir, SystemDynamicCodeJsName)
    if util.Exist(jsFile) {
        os.Remove(jsFile)
    }
    if !util.Exist(jsFile) {
        if err = os.MkdirAll(SystemDynamicCodeJsDir, 0777); err != nil {
            log.Fatalln("mkdir for", SystemDynamicCodeJsDir, "failed, err is", err)
            return
        }
    }

    var fileOut *os.File
    if fileOut, err = os.Create(jsFile); err != nil {
        log.Println("unable to create js file:%v, err is %v", jsFile, err)
        return
    }
    defer fileOut.Close()

    fileOut.WriteString(fmt.Sprintf("var UMS_ROOT = '%s'; \r\n", config.Playout.Ums))
    fileOut.WriteString(fmt.Sprintf("var BPO_ROOT = '%s:%d';\n", config.Playout.Ip, config.Listen))

    // check resource video dir exist
    if !util.Exist(config.Resources.VideoDir) {
        if err = os.MkdirAll(config.Resources.VideoDir, 0777); err != nil {
            log.Fatalln("mkdir for", config.Resources.VideoDir, "failed, err is", err)
            return
        }
    }
    return
}


