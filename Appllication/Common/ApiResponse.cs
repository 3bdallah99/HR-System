using System.Collections.Generic;

namespace Appllication.Common
{
    public class ApiResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public List<string>? Errors { get; set; }

        public static ApiResponse Fail(string message, List<string>? errors = null)
            => new() { Success = false, Message = message, Errors = errors };
    }

    public class ApiResponse<T> : ApiResponse
    {
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string? message = null)
            => new() { Success = true, Data = data, Message = message };

        public new static ApiResponse<T> Fail(string message, List<string>? errors = null)
            => new() { Success = false, Message = message, Errors = errors };
    }
}
