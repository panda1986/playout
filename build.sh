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
thirdparty_dir=`(cd ${work_dir}/../3rdparty && pwd)`
mkdir -p $objs
echo "work_dir: $work_dir"
echo "objs: $objs"
echo "release: $release"

log="${objs}/log/build.`date +%s`.log" && . ${thirdparty_dir}/scripts/log.sh && check_log
ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi

function setup_variables()
{
    build_dir=${objs}/build
    build_shared_thirdparty_dir=${build_dir}/shared/src
    build_shared_objs_dir=${build_dir}/shared/objs
    build_trans_src_dir=${build_dir}/trans/src
    build_trans_objs_dir=${build_dir}/trans/objs
}

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
    if [[ ! -d $GOPATH/src/github.com/go-sql-driver/mysql ]]; then
        echo "install mysql"
        mkdir -p $GOPATH/src/github.com/go-sql-driver && cd $GOPATH/src/github.com/go-sql-driver &&
        rm -rf mysql-1.2 && tar xf $work_dir/../3rdparty/go/mysql-1.2.tar.gz &&
        rm -f mysql && ln -sf mysql-1.2 mysql
        ret=$?; if [[ 0 -ne $ret ]]; then echo "install github.com/go-sql-driver/mysql failed. ret=$ret"; exit $ret; fi
    fi
    echo "mysql ok"

    if [[ ! -d $GOPATH/src/chnvideo.com/cloud/common ]]; then
        echo "install mysql"
        mkdir -p $GOPATH/src/chnvideo.com/cloud && cd $GOPATH/src/chnvideo.com/cloud &&
        rm -rf go_common && git clone root@192.168.1.230:bravo_dev/go_common.git &&
        rm -f common && ln -sf go_common common
        ret=$?; if [[ 0 -ne $ret ]]; then echo "install github.com/chnvideo.com/cloud/common failed. ret=$ret"; exit $ret; fi
    fi
    echo "common ok"
}

function build_shared_yasm(){
    # add yasm to PATH for x264/ffmpeg to access it.
    yasm_dir="${build_shared_objs_dir}/bin"
    export PATH=${PATH}:${yasm_dir}

    yasm_bin="${yasm_dir}/yasm"
    if [[ ! -f ${yasm_bin} ]]; then
        ok_msg "build yasm in ${build_shared_thirdparty_dir}/yasm-1.2.0"
        (
            cd ${build_shared_thirdparty_dir} &&
            rm -rf yasm-1.2.0 && unzip -q ${thirdparty_dir}/yasm-1.2.0.zip &&
            cd yasm-1.2.0 &&
            ./configure --prefix=${build_shared_objs_dir} --enable-static &&
            make &&
            make install
        ) >> $log 2>&1
        ret=$?; if [[ 0 -ne ${ret} ]]; then failed_msg "build yasm failed"; return $ret; fi
    fi
    ok_msg "yasm builded in "
    ok_msg "    ${yasm_bin}";

    return 0;
}

function build_shared_libz_a(){
    libz_a="${build_shared_thirdparty_dir}/zlib-1.2.8/libz.a"
    cd ${build_shared_thirdparty_dir} &&
    if [[ ! -f ${libz_a} ]]; then
        (
            tar xf ${thirdparty_dir}/zlib-1.2.8.tar.gz &&
            cd zlib-1.2.8 && ./configure && make
        ) >> $log 2>&1
        ret=$?; if [[ 0 -ne ${ret} ]]; then failed_msg "build libz_a failed"; return $ret; fi
    fi
    ok_msg "build libz.a success"
    return 0;
}

function build_shared_fdkaac(){
    libfdkaac_lib="${build_shared_objs_dir}/lib/libfdk-aac.a"
    if [[ ! -f ${libfdkaac_lib} ]]; then
        ok_msg "build libfdkaac in ${build_shared_thirdparty_dir}/fdk-aac-master"
        (
            cd ${build_shared_thirdparty_dir} &&
            rm -rf fdk-aac-master && unzip ${thirdparty_dir}/fdk-aac-master.zip &&
            cd fdk-aac-master &&
            bash autogen.sh &&
            ./configure --prefix=${build_shared_objs_dir} --enable-static --disable-shared &&
            make $jobs &&
            make install
        ) >> $log 2>&1
        ret=$?; if [[ 0 -ne ${ret} ]]; then failed_msg "build libfdkaac failed"; return $ret; fi
    fi
    ok_msg "libfdkaac builded in "
    ok_msg "    ${libfdkaac_lib}";
    return 0;
}

function build_shared_libmp3lame(){
    lame_lib="${build_shared_objs_dir}/lib/libmp3lame.a"
    if [[ ! -f ${lame_lib} ]]; then
        ok_msg "build lame in ${build_shared_thirdparty_dir}/lame-3.99.1"
        (
            cd ${build_shared_thirdparty_dir} &&
            rm -rf lame-3.99.1 && tar xf ${thirdparty_dir}/lame-3.99.1.tar.gz &&
            cd lame-3.99.1 &&
            ./configure --prefix=${build_shared_objs_dir} --enable-static &&
            make $jobs &&
            make install
        ) >> $log 2>&1
        ret=$?; if [[ 0 -ne ${ret} ]]; then failed_msg "build lame failed"; return $ret; fi
    fi
    ok_msg "lame builded in "
    ok_msg "    ${lame_lib}";

    return 0;
}

function build_shared_x264_core142(){
    x264_lib="${build_shared_objs_dir}/x264_core142/lib/libx264.a"
    if [[ ! -f ${x264_lib} ]]; then
        ok_msg "build x264 core 142 in ${build_shared_thirdparty_dir}/x264-snapshot-20140806-2245"
        (
            cd ${build_shared_thirdparty_dir} &&
            rm -rf x264-snapshot-20140806-2245 && tar xf ${thirdparty_dir}/x264-snapshot-20140806-2245.tar.bz2 &&
            cd x264-snapshot-20140806-2245 &&
            patch -p1 < ${thirdparty_dir}/live-encoder-tools/x264_get_level_idc.patch
            ./configure --prefix=${build_shared_objs_dir}/x264_core142 --enable-static &&
            make $jobs &&
            make install
        ) >> $log 2>&1
        ret=$?; if [[ 0 -ne ${ret} ]]; then failed_msg "build x264 core 142 failed"; return $ret; fi
    fi
    ok_msg "x264 core 142 builded in "
    ok_msg "    ${x264_lib}";

    return 0;
}

function build_shared(){
    mkdir -p ${build_shared_thirdparty_dir} && mkdir -p ${build_shared_objs_dir}
    ret=$?; if [[ $ret -ne 0 ]]; then failed_msg "mk ffmpeg build dir failed"; return $ret; fi
    ok_msg "the build_shared_thirdparty_dir=${build_shared_thirdparty_dir}"
    ok_msg "the build_shared_objs_dir=${build_shared_objs_dir}"

    build_shared_libz_a
    ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi

    build_shared_yasm
    ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi

    build_shared_fdkaac
    ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi

    build_shared_libmp3lame
    ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi

    build_shared_x264_core142
    ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi

    ok_msg "mv all so to force the ffmpeg to build in static"
    rm -rf ${build_shared_objs_dir}/x264_core142/lib/*.so*
    rm -rf ${build_shared_objs_dir}/lib/*.so*

    ok_msg "build shared(x264,x265,faac,mp3lame,fdkaac) success."
    return 0;
}

function build_transcoder_ffmpeg_3_2_1()
{
    echo "start to build ffmpeg"
    ffmpeg_bin="${build_trans_objs_dir}/ffmpeg-3.2.1/bin/ffmpeg"
    if [[ ! -f ${ffmpeg_bin} ]]; then
        ok_msg "[slow] build ffmpeg-3.2.1 in ${build_trans_src_dir}/ffmpeg-3.2.1"
        (
            cd ${build_trans_src_dir} &&
            rm -rf ffmpeg-3.2.1 && tar xf ${thirdparty_dir}/transtools/ffmpeg-3.2.1.tar.bz2 &&
            cd ffmpeg-3.2.1 &&
            ffmpeg_exported_release_dir=${build_shared_objs_dir} &&
            export ffmpeg_exported_release_dir &&
            ./configure --enable-gpl --enable-nonfree --prefix=${build_trans_objs_dir}/ffmpeg-3.2.1 --cc= \
                --enable-static \
                --extra-cflags='-I${ffmpeg_exported_release_dir}/include -I${ffmpeg_exported_release_dir}/x264_core142/include' \
                --extra-ldflags='-L${ffmpeg_exported_release_dir}/lib -L${ffmpeg_exported_release_dir}/x264_core142/lib -ldl -lm' \
                --disable-ffplay --disable-ffprobe --disable-ffserver --disable-doc \
                --enable-postproc --enable-bzlib --enable-zlib --enable-parsers \
                --enable-libx264 --enable-libmp3lame --enable-libfdk-aac \
                --enable-pthreads --extra-libs=-lpthread \
                --enable-encoders --enable-decoders --enable-avfilter --enable-muxers --enable-demuxers &&
            make $jobs &&
            make install
        ) >> $log 2>&1
        ret=$?; if [[ 0 -ne ${ret} ]]; then failed_msg "build transcoder ffmpeg-3.2.1 failed"; return $ret; fi
    fi
    ok_msg "transcoder ffmpeg-3.2.1 builded in "
    ok_msg "    ${ffmpeg_bin}";

    return 0;
}



function build_media_info(){
    ffmpeg_bin="${build_trans_objs_dir}/ffmpeg-3.2.1/bin/media.info"
    if [[ ! -f ${ffmpeg_bin} ]]; then
        ok_msg "build osdt_media_info in ${build_trans_objs_dir}/ffmpeg-3.2.1/bin/media.info"
        (
            cd ${build_trans_objs_dir} &&
            g++ ${thirdparty_dir}/transtools/osdt.media.info.cpp \
            -o ${build_trans_objs_dir}/ffmpeg-3.2.1/bin/media.info \
            -I ${build_shared_objs_dir}/include \
            -I ${build_trans_objs_dir}/ffmpeg-3.2.1/include \
            -I ${build_shared_objs_dir}/x264_core142/include \
            -L ${build_trans_objs_dir}/ffmpeg-3.2.1/lib \
            -L ${build_shared_objs_dir}/lib \
            -L ${build_shared_objs_dir}/x264_core142/lib \
            -lavformat -lavcodec -lavutil -lfdk-aac -lmp3lame -lswscale -lswresample -lx264 -lstdc++ -lm -lz -lbz2 -lpthread -ldl &&
            strip ${build_trans_objs_dir}/ffmpeg-3.2.1/bin/media.info
        ) >> $log 2>&1
        ret=$?; if [[ 0 -ne ${ret} ]]; then failed_msg "build osdt_media_info failed"; return $ret; fi
    fi

    ok_msg "build transcode tools success."
    return 0;
}

function build_tools()
{
    mkdir -p ${build_trans_src_dir} && mkdir -p ${build_trans_objs_dir}
    ret=$?; if [[ $ret -ne 0 ]]; then failed_msg "mk trans build dir failed"; return $ret; fi
    ok_msg "the build_trans_src_dir=${build_trans_src_dir}"
    ok_msg "the build_trans_objs_dir=${build_trans_objs_dir}"

    build_transcoder_ffmpeg_3_2_1
    ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi

    #build_media_info
    #ret=$?; if [[ $ret -ne 0 ]]; then exit $ret; fi
}

function build_playout()
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

setup_variables
go_platform
install_pkg

build_shared
ret=$?; if [[ $ret -ne 0 ]]; then
    failed_msg " build shared failed. see detail log at "
    failed_msg "    $log";
    echo "cat $log";
    exit $ret;
fi

build_tools
ret=$?; if [[ $ret -ne 0 ]]; then
    failed_msg " build tools failed. see detail log at "
    failed_msg "    $log";
    echo "cat $log";
    exit $ret;
fi

build_playout

echo "* 启动playout功能:"
echo "      go build -o objs/playout chnvideo.com/cloud/playout && ./objs/playout -c playout.conf"

