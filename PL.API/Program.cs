using Appllication.Features.Employee.Queries.GetAllEmployees;
using Domain.Interfaces;
using Infrastructure;
using Infrastructure.Data;
using Infrastructure.Data.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
            builder.Services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(GetAllEmployeesQuery).Assembly));
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
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
