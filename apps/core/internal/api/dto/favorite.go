package dto

// AddFavoriteReq Add favorite request.
type AddFavoriteReq struct {
	Title string  `json:"title" binding:"required"`
	URL   string  `json:"url" binding:"required"`
	Icon  *string `json:"icon"`
}

// ImportFavoritesReq Import favorites request.
type ImportFavoritesReq struct {
	Favorites []AddFavoriteReq `json:"favorites" binding:"required"`
}
