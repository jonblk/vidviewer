package errors

import (
	"net/http"
)

type RootFolderNotFoundError struct {
    Message    string
    StatusCode int
}

func (e *RootFolderNotFoundError) Error() string {
    return e.Message
}

func NewRootFolderNotFoundError() *RootFolderNotFoundError{
	return &RootFolderNotFoundError {
		Message: "Root folder not found",
		StatusCode: http.StatusBadRequest,
	}
}