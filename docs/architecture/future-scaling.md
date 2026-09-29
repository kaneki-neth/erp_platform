# Future Scaling Roadmap

## 1. Modular Monolith Scaling
Scale based on evidence rather than premature distributed microservices:

```
                  Internet / Cloudflare
                            │
                            ▼
                      Load Balancer
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          Laravel API   Laravel API   Laravel API
          Worker #1     Worker #2     Worker #3
              │             │             │
              └─────────────┼─────────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
            MySQL Primary        Redis Cluster
           (Read Replicas)       (Cache & Queues)
```

## 2. Infrastructure Progression
1. **Phase 0–2**: Single Laravel API server + MySQL + local/Redis cache.
2. **Phase 3+**: Horizontal stateless API workers behind load balancer, background queue workers, read replicas.
