Grafana Dashboards
Grafana is configured to visualize metrics from Prometheus.

Default Dashboards:
Service Health: Real-time health status of all microservices
Error Tracking: Error rates and types across services
Latency Analysis: Request duration and response times
Dependency Health: Inventory reservation success/failure rates

Access: http://localhost:3001 (Grafana default port)
Data Source: Prometheus at http://prometheus:4000

Testing with Gremlin
The system includes chaos engineering features to test monitoring:
Simulate latency: Order Service fails 25% of requests to Inventory with 2-5s delays
Trigger failures: Test error tracking and alerting
Monitor graceful degradation: Observe how services handle timeouts and failures