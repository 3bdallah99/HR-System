using Appllication.Common.Behaviors;
using Appllication.Features.Employee.Queries.GetAllEmployees;
using Domain.Interfaces;
using FluentValidation;
using Infrastructure;
using Infrastructure.Data;
using Infrastructure.Data.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PL.API.Middleware;

namespace PL.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Configure Entity Framework and SQL Server
            builder.Services.AddDbContext<HRDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
            // Configure Identity
            builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
            })
                    .AddEntityFrameworkStores<HRDbContext>()
                    .AddDefaultTokenProviders();

            // Register UnitOfWork
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Register MediatR
            builder.Services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssembly(typeof(GetAllEmployeesQuery).Assembly));

            // Register FluentValidation — scans the Application assembly for all validators
            builder.Services.AddValidatorsFromAssembly(typeof(GetAllEmployeesQuery).Assembly);

            // Register MediatR Pipeline Behavior (Validation runs before every handler)
            builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline. //
            app.UseMiddleware<GlobalExceptionMiddleware>();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
