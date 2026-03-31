package dto

// AddFavoriteReq 添加收藏请求。
type AddFavoriteReq struct {
	Title string  `json:"title" binding:"required"`
	URL   string  `json:"url" binding:"required"`
	Icon  *string `json:"icon"`
}

// ImportFavoritesReq 导入收藏请求。
type ImportFavoritesReq struct {
	Favorites []AddFavoriteReq `json:"favorites" binding:"required"`
}
