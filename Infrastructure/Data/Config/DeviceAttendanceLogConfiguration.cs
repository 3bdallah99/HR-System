using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class DeviceAttendanceLogConfiguration : IEntityTypeConfiguration<DeviceAttendanceLog>
    {
        public void Configure(EntityTypeBuilder<DeviceAttendanceLog> builder)
        {
            builder.ToTable("DeviceAttendanceLogs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.DeviceSerial)
                   .HasMaxLength(50)
                   .IsRequired();

            builder.Property(x => x.UserPin)
                   .HasMaxLength(50)
                   .IsRequired();

            builder.Property(x => x.WorkCode)
                   .HasMaxLength(50);

            builder.Property(x => x.ErrorMessage)
                   .HasMaxLength(500);

            builder.Property(x => x.RawData)
                   .HasMaxLength(1000);

            builder.HasIndex(x => new { x.DeviceSerial, x.UserPin, x.PunchTime });
            builder.HasIndex(x => x.IsProcessed);

            builder.HasOne(x => x.Employee)
                   .WithMany(e => e.DeviceAttendanceLogs)
                   .HasForeignKey(x => x.EmployeeId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
