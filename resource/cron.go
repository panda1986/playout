package resource

import (
    "time"
    "chnvideo.com/cloud/common/core"
    "fmt"
)

type Crontab struct {
    interval   time.Duration
    techReview *TechCron
    trans      *TransCron
}

func NewCrontab(interval time.Duration) *Crontab {
    v := &Crontab{
        interval: interval,
        techReview: &TechCron{interval},
        trans: &TransCron{interval},
    }
    return v
}

func (v *Crontab) Serve() {
    go v.techReview.Serve()
    go v.trans.Serve()
}

// tech review cron task
type TechCron struct {
    interval time.Duration
}

func (v *TechCron) Cycle() (err error) {
    core.LoggerTrace.Println("do a cron for tech review")
    // import a resource which workflow_status == "tech_review_waittinh"
    // do tech review  for this resource
    // record tech review logs
    // update tech review status
    return
}

// start a goroutine to do tech review task
func (v *TechCron) Serve() {
    // reset resource whose workflow_tatus == "tech_reviewing" to "tech_review_waitting"
    go func() {
        for {
            if err := v.Cycle(); err != nil {
                core.LoggerError.Println(fmt.Sprintf("do tech cron cycle failed, err is %v", err))
            }
            time.Sleep(v.interval)
        }
    }()
}

// transcode cron task
type TransCron struct {
    interval time.Duration
}

func (v *TransCron) Cycle() (err error) {
    core.LoggerTrace.Println("do a cron for transcode")
    // import a resource which workflow_status == "init"
    // do tech review  for this resource
    // record tech review logs
    // update tech review status
    return
}

// start a goroutine to do transcode task
func (v *TransCron) Serve() {
    // reset resource whose workflow_tatus == "trans_coding" to "trans_waitting"
    go func() {
        for {
            if err := v.Cycle(); err != nil {
                core.LoggerError.Println(fmt.Sprintf("do transcode cycle failed, err is %v", err))
            }
            time.Sleep(v.interval)
        }
    }()
}
