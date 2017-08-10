package util

import "os"

func Exist(filename string) bool {
    _, err := os.Stat(filename)
    return err == nil || os.IsExist(err)
}
