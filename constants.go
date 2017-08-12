package main

const (
    Version = "2.0.0"
    ProductSystem = "BLS"
    CookieName = "sessionid"

    // for front_end to redirect
    SystemDynamicCodeJsDir = "./static-dir/js"
    SystemDynamicCodeJsName = "dynamic_code.js"

    MenuTopType  = "0"
    MenuResourceType = "1"
    MenuChannelType = "2"

    UmsGetMenuListApi = "/common/ajax/get_menu_list/"
    UmsGetUserApi = "/accounts/ajax/get_user/"
    UmsLoginApi = "/accounts/login/?next=/"
    UmsLogoutApi = "/accounts/ajax/logout_api/?callback="

    ErrorGetUserInfo int = 200 + iota
    ErrorReadRequestBody
    ErrorInvalidMenuType
    ErrorGetMenuList
)


var MenuTypes []string = []string{MenuTopType, MenuResourceType, MenuChannelType}
