using Domain.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repository;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;

namespace Infrastructure
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly HRDbContext _dbContext;
        private readonly ConcurrentDictionary<string, object> _repositories;


        public UnitOfWork(HRDbContext dbContext)
        {
            _dbContext = dbContext;
            _repositories = new ConcurrentDictionary<string, object>();

        }

        public async Task<int> CompleteAsync(CancellationToken cancellationToken = default) => await _dbContext.SaveChangesAsync(cancellationToken);

        public async ValueTask DisposeAsync() => await _dbContext.DisposeAsync();

        public IGenericRepository<TEntity> GetRepository<TEntity>() where TEntity : class
        {
            return (IGenericRepository<TEntity>)_repositories.GetOrAdd(typeof(TEntity).Name,
                (t) => new GenericRepository<TEntity>(_dbContext));
        }
    }
}