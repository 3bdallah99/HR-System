using Appllication.Common;
using Appllication.Common.Exceptions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace PL.API.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            
            var (statusCode, response) = exception switch
            {
                NotFoundException notFoundEx => (
                    HttpStatusCode.NotFound,
                    ApiResponse.Fail(notFoundEx.Message)
                ),

                ConflictException conflictEx => (
                    HttpStatusCode.Conflict,
                    ApiResponse.Fail(conflictEx.Message)
                ),

                ForbiddenException forbiddenEx => (
                    HttpStatusCode.Forbidden,
                    ApiResponse.Fail(forbiddenEx.Message)
                ),

                BadRequestException badReqEx => (
                    HttpStatusCode.BadRequest,
                    ApiResponse.Fail(badReqEx.Message)
                ),

                // Catch all other exceptions (Internal Server Errors)
                _ => (
                    HttpStatusCode.InternalServerError,
                    ApiResponse.Fail("An unexpected error occurred. Please try again later.", 
                                     _env.IsDevelopment() ? new List<string> { exception.Message, exception.StackTrace ?? "" } : null) 
                )
            };

            // Log the error
            _logger.LogError(exception, "Exception caught by GlobalExceptionMiddleware: {Message}", exception.Message);

            // Write the JSON response
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
    }
}
