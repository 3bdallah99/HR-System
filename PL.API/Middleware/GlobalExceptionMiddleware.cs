using Appllication.Common;
using Appllication.Common.Exceptions;
using Microsoft.AspNetCore.Http;
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

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
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
                                     new List<string> { exception.Message }) // Note: Detailed error included for development purposes. In strict production, keep it empty.
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
