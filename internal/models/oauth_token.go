package models

import (
	"time"

	"golang.org/x/oauth2"
)

// OAuthToken represents a stored OAuth token
type OAuthToken struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	AccessToken  string    `json:"-"` // Never expose in JSON
	RefreshToken string    `json:"-"` // Never expose in JSON
	TokenType    string    `json:"token_type"`
	Expiry       time.Time `json:"expiry"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ToOAuth2Token converts DB model to oauth2.Token
func (t *OAuthToken) ToOAuth2Token() *oauth2.Token {
	return &oauth2.Token{
		AccessToken:  t.AccessToken,
		RefreshToken: t.RefreshToken,
		TokenType:    t.TokenType,
		Expiry:       t.Expiry,
	}
}

// FromOAuth2Token creates OAuthToken from oauth2.Token
func FromOAuth2Token(userID int, token *oauth2.Token) *OAuthToken {
	return &OAuthToken{
		UserID:       userID,
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.Expiry,
	}
}
