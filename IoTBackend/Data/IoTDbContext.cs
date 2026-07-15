using Microsoft.EntityFrameworkCore;
using IoTBackend.Models;

namespace IoTBackend.Data
{
    public class IoTDbContext : DbContext
    {
        public IoTDbContext(DbContextOptions<IoTDbContext> options) : base(options) { }

        public DbSet<Device> Devices { get; set; }
        public DbSet<SensorData> SensorData { get; set; }
        public DbSet<DeviceCommand> DeviceCommands { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Device>()
                .HasIndex(d => d.DeviceId)
                .IsUnique();

            modelBuilder.Entity<Device>()
                .HasMany(d => d.SensorReadings)
                .WithOne(s => s.Device)
                .HasPrincipalKey(d => d.DeviceId)
                .HasForeignKey(s => s.DeviceId);

            modelBuilder.Entity<Device>()
                .HasMany(d => d.Commands)
                .WithOne(c => c.Device)
                .HasPrincipalKey(d => d.DeviceId)
                .HasForeignKey(c => c.DeviceId);
        }
    }
}
