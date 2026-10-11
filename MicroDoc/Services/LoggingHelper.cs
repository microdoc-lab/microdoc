namespace MicroDoc.Services
{
    public static class LoggingHelper 
    {
        private static readonly TimeSpan operationThreshold = TimeSpan.FromSeconds(1);

        public static T Execute<T>(ILogger logger, string operation, object data, Func<T> action)
        {
            var timer = System.Diagnostics.Stopwatch.StartNew();
            logger.LogTrace($"About to {operation} {data}");
            try
            {
                var result = action();
                timer.Stop();

                if (timer.Elapsed >= operationThreshold)
                    logger.LogWarning($"Delay in {operation} {data}, ElapsedMs={timer.ElapsedMilliseconds}");
                else
                    logger.LogInformation($"Done  to {operation} {data}, ElapsedMs={timer.ElapsedMilliseconds}");

                return result;
            }
            catch (Exception ex)
            {
                timer.Stop();
                logger.LogError(ex, $"Error in {operation} {data}, ElapsedMs={timer.ElapsedMilliseconds}");
                throw;
            }
        }

        public static ErrorCode Execute(ILogger logger, string operation, object data, Func<ErrorCode> action)
        {
            var timer = System.Diagnostics.Stopwatch.StartNew();
            logger.LogTrace($"About to {operation} {data}");
            try
            {
                var result = action();
                timer.Stop();

                if (result == ErrorCode.Ok)
                {
                    if (timer.Elapsed >= operationThreshold)
                        logger.LogWarning($"Delay in {operation} {data}, ElapsedMs={timer.ElapsedMilliseconds}");
                    else
                        logger.LogInformation($"Done  to {operation} {data}, ElapsedMs={timer.ElapsedMilliseconds}");
                }
                else
                    logger.LogWarning($"Fail  to {operation} {data}, ElapsedMs={timer.ElapsedMilliseconds}. {result}");

                return result;
            }
            catch (Exception ex)
            {
                timer.Stop();
                logger.LogError(ex, $"Error in {operation} {data}, ElapsedMs={timer.ElapsedMilliseconds}");
                throw;
            }
        }
    }
}
