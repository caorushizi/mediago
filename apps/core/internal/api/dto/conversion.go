package dto

// AddConversionReq Add conversion record request.
type AddConversionReq struct {
	Name         *string `json:"name"`
	Path         string  `json:"path" binding:"required"`
	OutputFormat string  `json:"outputFormat" binding:"required"`
	Quality      string  `json:"quality" binding:"required"`
}

// ConversionPaginationReq Paginated query request.
type ConversionPaginationReq struct {
	Current  int `form:"current" json:"current"`
	PageSize int `form:"pageSize" json:"pageSize"`
}
