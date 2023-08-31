package errors

import (
	"net/http"
)

func RootFolderNotFoundError() *Error{
	return &Error {
		Message: "Root folder not found",
		StatusCode: http.StatusBadRequest,
	}
}