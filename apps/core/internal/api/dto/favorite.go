package dto

// AddFavoriteReq Add favorite request.
// Title is optional; when empty the server falls back to the URL so the
// entry still has a human-visible label.
type AddFavoriteReq struct {
	Title string  `json:"title"`
	URL   string  `json:"url" binding:"required"`
	Icon  *string `json:"icon"`
}

// ImportFavoritesReq Import favorites request.
type ImportFavoritesReq struct {
	Favorites []AddFavoriteReq `json:"favorites" binding:"required"`
}
