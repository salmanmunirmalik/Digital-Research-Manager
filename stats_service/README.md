# Statistical Analysis Service

A Python-based FastAPI service that provides comprehensive statistical analysis capabilities for the Research Lab application using scipy, statsmodels, and pandas.

## Features

### Statistical Analysis Types

1. **Descriptive Statistics**
   - Mean, median, mode
   - Standard deviation and variance
   - Quartiles (Q1, Q3, IQR)
   - Skewness and kurtosis
   - Confidence intervals
   - Min, max, range

2. **Correlation Analysis**
   - Pearson correlation coefficient
   - P-value and significance testing
   - Correlation matrix
   - Interpretation guidelines

3. **Linear Regression**
   - R-squared and adjusted R-squared
   - F-statistic and p-value
   - Coefficient analysis
   - Standard errors and confidence intervals
   - Residual analysis

4. **Normality Tests**
   - Shapiro-Wilk test
   - Anderson-Darling test
   - Interpretation of results

## Installation

### Prerequisites
- Python 3.8+
- pip or conda

### Setup

1. **Create virtual environment:**
   ```bash
   cd stats_service
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

### Development Mode
```bash
# From the stats_service directory
python run_stats_service.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

The service will be available at `http://localhost:8001`

## API Documentation

### Interactive Documentation
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Main Endpoints

#### Health Check
```
GET /health
```

#### Analysis Types
```
GET /analysis-types
```

#### Perform Analysis
```
POST /analyze
Content-Type: application/json

{
  "data": [
    {
      "id": "point_1",
      "name": "Sample 1",
      "value": 42.5,
      "category": "molecular_biology",
      "date": "2024-01-15T10:30:00Z"
    }
  ],
  "analysis_type": "descriptive",
  "options": {}
}
```

#### Specific Analysis Endpoints
- `POST /descriptive` - Descriptive statistics
- `POST /correlation` - Correlation analysis
- `POST /regression` - Linear regression
- `POST /normality` - Normality tests

## Data Format

### Input Data Structure
```json
{
  "data": [
    {
      "id": "string",           // Unique identifier
      "name": "string",         // Data point name
      "value": "number",        // Numeric value for analysis
      "category": "string",     // Optional category
      "date": "string"          // Optional ISO date string
    }
  ],
  "analysis_type": "string",    // Analysis type
  "options": {}                 // Optional analysis parameters
}
```

### Response Structure
```json
{
  "success": true,
  "results": {
    // Analysis-specific results
  },
  "metadata": {
    "analysis_type": "string",
    "data_points": "number",
    "timestamp": "string",
    "service_version": "string"
  },
  "error": null
}
```

## Integration with Node.js Backend

The service is integrated with the main Node.js backend through the `StatisticalAnalysisService` class in `server/statsService.js`. The Node.js backend:

1. Validates incoming data
2. Forwards requests to the Python service
3. Formats results for frontend consumption
4. Handles error cases and fallbacks

### Environment Variables

Set the following environment variable to configure the service URL:

```bash
STATS_SERVICE_URL=http://localhost:8001
```

## Error Handling

The service includes comprehensive error handling:

- **Data validation**: Ensures proper data format and types
- **Statistical errors**: Handles edge cases in calculations
- **Service errors**: Graceful handling of service unavailability
- **Timeout handling**: Configurable request timeouts

## Performance Considerations

- **Caching**: Results can be cached for repeated analyses
- **Async processing**: Non-blocking request handling
- **Memory management**: Efficient handling of large datasets
- **Timeout limits**: Prevents long-running calculations from blocking

## Testing

### Manual Testing
Use the interactive documentation at `/docs` to test endpoints manually.

### Example Test Data
```json
{
  "data": [
    {"id": "1", "name": "Sample 1", "value": 45.2},
    {"id": "2", "name": "Sample 2", "value": 42.1},
    {"id": "3", "name": "Sample 3", "value": 48.7},
    {"id": "4", "name": "Sample 4", "value": 41.3},
    {"id": "5", "name": "Sample 5", "value": 46.8}
  ],
  "analysis_type": "descriptive"
}
```

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computing
- **scipy**: Scientific computing and statistics
- **statsmodels**: Statistical modeling
- **uvicorn**: ASGI server for FastAPI
- **pydantic**: Data validation using Python type annotations

## Security

- **CORS**: Configured to allow requests from frontend
- **Input validation**: Strict data validation using Pydantic
- **Error sanitization**: Sensitive information is not exposed in errors

## Monitoring

- **Health checks**: Built-in health monitoring endpoint
- **Logging**: Comprehensive logging for debugging
- **Metrics**: Request timing and success rates

## Future Enhancements

- **Advanced statistical tests**: t-tests, ANOVA, chi-square tests
- **Machine learning**: Basic ML algorithms for data analysis
- **Visualization**: Chart generation and export
- **Batch processing**: Multiple analyses in single request
- **Custom functions**: User-defined statistical functions
