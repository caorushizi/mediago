package dto

// AddConversionReq 添加转换记录请求。
type AddConversionReq struct {
	Name *string `json:"name"`
	Path string  `json:"path" binding:"required"`
}

// ConversionPaginationReq 分页查询请求。
type ConversionPaginationReq struct {
	Current  int `form:"current" json:"current"`
	PageSize int `form:"pageSize" json:"pageSize"`
}
