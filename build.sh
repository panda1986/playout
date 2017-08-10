#!/bin/bash

# calc the dir
echo "argv[0]=$0"
if [[ ! -f $0 ]]; then
    echo "directly execute the scripts on shell.";
    work_dir=`pwd`
else
    echo "execute scripts in file: $0";
    work_dir=`dirname $0`; work_dir=`(cd ${work_dir} && pwd)`
fi

objs=$work_dir/objs
release=$objs/_release
mkdir -p $objs
echo "work_dir: $work_dir"
echo "objs: $objs"
echo "release: $release"

function go_platform()
{
    # for go api
    go_blog="http://blog.csdn.net/win_lin/article/details/40618671"
    # check go
    go help >/dev/null 2>&1
    ret=$?; if [[ 0 -ne $ret ]]; then echo "go not install, see $go_blog. ret=$ret"; exit $ret; fi
    echo "go is ok"
    # check GOPATH
    if [[ -d $GOPATH ]]; then
        echo "GOPATH=$GOPATH";
    else
        echo "GOPATH not set.";
        echo "see $go_blog.";
        exit -1;
    fi
    echo "GOPATH is ok"
}

function install_pkg()
{
    # lib from go-oryx.
    if [[ ! -d $GOPATH/src/github.com/ossrs/go-oryx-lib ]]; then
        echo "install go-oryx-lib"
        mkdir -p $GOPATH/src/github.com/ossrs && cd $GOPATH/src/github.com/ossrs &&
        git clone https://github.com/ossrs/go-oryx-lib.git
        ret=$?; if [[ $ret -ne 0 ]]; then echo "build go-oryx-lib failed. ret=$ret"; exit $ret; fi
    fi
    echo "go-oryx-lib ok"

    if [[ ! -d $GOPATH/src/github.com/go-sql-driver/mysql ]]; then
        echo "install mysql"
        mkdir -p $GOPATH/src/github.com/go-sql-driver && cd $GOPATH/src/github.com/go-sql-driver &&
        rm -rf mysql-1.2 && tar xf $work_dir/../3rdparty/go/mysql-1.2.tar.gz &&
        rm -f mysql && ln -sf mysql-1.2 mysql
        ret=$?; if [[ 0 -ne $ret ]]; then echo "install github.com/go-sql-driver/mysql failed. ret=$ret"; exit $ret; fi
    fi
    echo "mysql ok"
}

function install_playout()
{
    if [[ ! -d $GOPATH/src/chnvideo.com/cloud/playout ]]; then
        mkdir -p $GOPATH/src/chnvideo.com/cloud &&
        ln -sf $work_dir $GOPATH/src/chnvideo.com/cloud/playout
        ret=$?; if [[ 0 -ne $ret ]]; then echo "chnvideo.com/cloud/playout failed. ret=$ret"; exit $ret; fi
    fi
    echo "playout ok"

    go build -o objs/playout chnvideo.com/cloud/playout
    ret=$?; if [[ 0 -ne $ret ]]; then echo "build playout failed. ret=$ret"; exit $ret; fi
    echo "build playout ok"
}

go_platform
install_pkg
install_playout

echo "* 启动playout功能:"
echo "      go build -o objs/playout chnvideo.com/cloud/playout && ./objs/playout -c playout.conf"

