package main

const (
    Version = "2.0.0"
    ProductSystem = "BLS"
    CookieName = "sessionid"
    UmsGetMenuListApi = "/common/ajax/get_menu_list/"
    UmsGetUserApi = "/accounts/ajax/get_user/"
    UmsLoginApi = "/accounts/login/?next=/"
    UmsLogoutApi = "/accounts/ajax/logout_api/?callback="

    ErrorGetUserInfo int = 200 + iota
    ErrorGetMenuList
)
