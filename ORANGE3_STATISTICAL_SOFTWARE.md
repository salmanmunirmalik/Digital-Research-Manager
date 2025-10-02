# Orange3-Inspired Statistical Analysis Software

## Overview

This document describes the comprehensive statistical analysis software integrated into the Digital Research Manager, inspired by Orange3's visual programming approach for data mining and machine learning.

## Architecture

### Backend Services

#### 1. Advanced Statistical Service (Python)
- **Location**: `stats_service/advanced_main.py`
- **Port**: 5003
- **Framework**: FastAPI with Uvicorn
- **Purpose**: Advanced statistical analysis, machine learning, and data visualization

#### 2. Node.js Bridge Service
- **Location**: `server/advancedStatsService.js`
- **Purpose**: Bridge between React frontend and Python statistical service
- **Integration**: RESTful API endpoints in `server/index.ts`

### Frontend Components

#### 1. Statistical Analysis Tools Page
- **Location**: `pages/StatisticalAnalysisToolsPage.tsx`
- **Purpose**: Main interface for statistical analysis workflows
- **Features**: Visual workflow builder, data management, results display

#### 2. Navigation Integration
- **Location**: `components/SideNav.tsx`
- **Feature**: "Statistical Analysis Tools" sidebar item

## Key Features

### 1. Data Management
- **CSV Import**: Load data from CSV files
- **Excel Import**: Load data from Excel files
- **Data Info**: Get comprehensive data information
- **Column Selection**: Select specific columns for analysis
- **Duplicate Removal**: Remove duplicate rows
- **Missing Value Handling**: Handle missing values with various strategies

### 2. Statistical Analysis
- **Descriptive Statistics**: Mean, median, mode, standard deviation, etc.
- **Correlation Analysis**: Pearson, Spearman, Kendall correlations
- **Linear Regression**: Single and multiple linear regression
- **Clustering**: K-means, hierarchical clustering
- **Hypothesis Testing**: t-tests, chi-square tests, etc.
- **ANOVA**: Analysis of variance

### 3. Data Visualization
- **Scatter Plots**: Interactive scatter plot generation
- **Histograms**: Distribution visualization
- **Box Plots**: Statistical summary visualization
- **Correlation Heatmaps**: Correlation matrix visualization

### 4. Workflow Management
- **Visual Workflow Builder**: Drag-and-drop interface for creating analysis workflows
- **Node-Based System**: Modular approach with specialized nodes
- **Execution Engine**: Automatic workflow execution with dependency resolution
- **Results Management**: Store and retrieve analysis results

## API Endpoints

### Health & Status
- `GET /api/advanced-stats/health` - Service health check

### Data Loading
- `POST /api/advanced-stats/data/load-csv` - Load CSV data
- `POST /api/advanced-stats/data/load-excel` - Load Excel data

### Data Preprocessing
- `POST /api/advanced-stats/preprocessing/data-info` - Get data information
- `POST /api/advanced-stats/preprocessing/select-columns` - Select columns
- `POST /api/advanced-stats/preprocessing/remove-duplicates` - Remove duplicates
- `POST /api/advanced-stats/preprocessing/handle-missing` - Handle missing values

### Statistical Analysis
- `POST /api/advanced-stats/analysis/descriptive` - Descriptive statistics
- `POST /api/advanced-stats/analysis/correlation` - Correlation analysis
- `POST /api/advanced-stats/analysis/regression` - Linear regression
- `POST /api/advanced-stats/analysis/clustering` - Clustering analysis
- `POST /api/advanced-stats/analysis/hypothesis-testing` - Hypothesis testing
- `POST /api/advanced-stats/analysis/anova` - ANOVA analysis

### Visualization
- `POST /api/advanced-stats/visualization/scatter-plot` - Create scatter plots

### Workflow Management
- `POST /api/advanced-stats/workflow/execute` - Execute analysis workflow

### Export
- `POST /api/advanced-stats/export/csv` - Export results to CSV

## Orange3-Inspired Widgets

### Data Widgets
1. **File Widget**: Load data from files
2. **Data Info Widget**: Display data information
3. **Select Columns Widget**: Column selection
4. **Preprocess Widget**: Data preprocessing operations

### Visualization Widgets
1. **Scatter Plot Widget**: Create scatter plots
2. **Histogram Widget**: Create histograms
3. **Box Plot Widget**: Create box plots
4. **Heatmap Widget**: Create correlation heatmaps

### Analysis Widgets
1. **Descriptive Stats Widget**: Calculate descriptive statistics
2. **Correlation Widget**: Perform correlation analysis
3. **Linear Regression Widget**: Linear regression analysis
4. **Clustering Widget**: Clustering analysis
5. **Hypothesis Testing Widget**: Statistical tests
6. **ANOVA Widget**: Analysis of variance

### Model Widgets
1. **Train Widget**: Train machine learning models
2. **Predict Widget**: Make predictions
3. **Evaluate Widget**: Model evaluation

## Workflow System

### Node Types
1. **Data Nodes**: Handle data input/output
2. **Preprocessing Nodes**: Data cleaning and transformation
3. **Analysis Nodes**: Statistical analysis operations
4. **Visualization Nodes**: Create plots and charts
5. **Model Nodes**: Machine learning operations
6. **Export Nodes**: Export results

### Connection System
- **Input/Output Ports**: Each node has defined input and output ports
- **Data Flow**: Data flows through connected nodes
- **Type Safety**: Port types ensure compatible connections
- **Validation**: Workflow validation before execution

### Execution Engine
- **Dependency Resolution**: Automatic ordering of node execution
- **Parallel Execution**: Independent nodes run in parallel
- **Error Handling**: Graceful error handling and reporting
- **Progress Tracking**: Real-time execution progress

## Data Types

### Supported Data Formats
- **CSV**: Comma-separated values
- **Excel**: .xlsx and .xls files
- **JSON**: JSON data format
- **Parquet**: Columnar data format

### Data Types
- **Numeric**: Integer and floating-point numbers
- **Categorical**: String and categorical data
- **DateTime**: Date and time data
- **Boolean**: True/false values

## Visualization Features

### Plot Types
1. **Scatter Plots**: X-Y relationship visualization
2. **Line Plots**: Time series and trend visualization
3. **Bar Charts**: Categorical data visualization
4. **Histograms**: Distribution visualization
5. **Box Plots**: Statistical summary visualization
6. **Heatmaps**: Correlation and matrix visualization
7. **Pie Charts**: Proportional data visualization

### Interactive Features
- **Zoom and Pan**: Interactive plot navigation
- **Tooltips**: Hover information
- **Selection**: Data point selection
- **Export**: Save plots as images
- **Customization**: Colors, labels, and styling

## Machine Learning Integration

### Algorithms
1. **Classification**: Logistic regression, decision trees, random forests
2. **Regression**: Linear regression, polynomial regression
3. **Clustering**: K-means, hierarchical clustering, DBSCAN
4. **Dimensionality Reduction**: PCA, t-SNE, UMAP

### Model Evaluation
- **Cross-validation**: K-fold cross-validation
- **Metrics**: Accuracy, precision, recall, F1-score
- **Confusion Matrix**: Classification performance
- **ROC Curves**: Classification threshold analysis

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- pnpm package manager

### Installation

1. **Install Python Dependencies**:
   ```bash
   cd stats_service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Install Node.js Dependencies**:
   ```bash
   pnpm install
   ```

### Running the Services

1. **Start All Services**:
   ```bash
   pnpm run dev:full-advanced
   ```

2. **Start Individual Services**:
   ```bash
   # Frontend
   pnpm run dev:frontend
   
   # Backend
   pnpm run dev:backend
   
   # Basic Stats Service
   pnpm run dev:stats
   
   # Advanced Stats Service
   pnpm run dev:advanced-stats
   ```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5002
- **Basic Stats Service**: http://localhost:8001
- **Advanced Stats Service**: http://localhost:5003
- **API Documentation**: http://localhost:5003/docs

## Usage Examples

### 1. Load and Analyze CSV Data

```javascript
// Load CSV data
const loadResponse = await fetch('/api/advanced-stats/data/load-csv', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: '/path/to/data.csv',
    options: { delimiter: ',', header: true }
  })
});

// Get data information
const infoResponse = await fetch('/api/advanced-stats/preprocessing/data-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: csvData })
});

// Calculate descriptive statistics
const statsResponse = await fetch('/api/advanced-stats/analysis/descriptive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: csvData })
});
```

### 2. Create a Statistical Workflow

```javascript
const workflow = {
  nodes: [
    {
      id: 'file-loader',
      type: 'File',
      position: { x: 100, y: 100 },
      data: { filePath: '/path/to/data.csv' }
    },
    {
      id: 'data-info',
      type: 'DataInfo',
      position: { x: 300, y: 100 },
      data: {}
    },
    {
      id: 'descriptive-stats',
      type: 'DescriptiveStats',
      position: { x: 500, y: 100 },
      data: {}
    }
  ],
  connections: [
    { source: 'file-loader', target: 'data-info' },
    { source: 'data-info', target: 'descriptive-stats' }
  ]
};

// Execute workflow
const response = await fetch('/api/advanced-stats/workflow/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workflowNodes: workflow.nodes, workflowConnections: workflow.connections })
});
```

### 3. Create Visualizations

```javascript
// Create scatter plot
const plotResponse = await fetch('/api/advanced-stats/visualization/scatter-plot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: csvData,
    xColumn: 'x_values',
    yColumn: 'y_values',
    options: {
      title: 'Scatter Plot',
      xLabel: 'X Values',
      yLabel: 'Y Values',
      color: 'blue'
    }
  })
});
```

## Advanced Features

### Custom Analysis Functions
- **Plugin System**: Extend functionality with custom nodes
- **Script Integration**: Run custom Python/R scripts
- **API Integration**: Connect to external statistical services

### Performance Optimization
- **Lazy Loading**: Load data only when needed
- **Caching**: Cache analysis results
- **Parallel Processing**: Multi-threaded analysis
- **Memory Management**: Efficient memory usage

### Collaboration Features
- **Shared Workflows**: Share analysis workflows
- **Version Control**: Track workflow changes
- **Comments**: Add notes to analyses
- **Export/Import**: Save and load workflows

## Troubleshooting

### Common Issues

1. **Service Not Starting**:
   - Check Python version (3.8+ required)
   - Verify virtual environment activation
   - Check port availability (5003)

2. **Import Errors**:
   - Ensure all dependencies are installed
   - Check Python path configuration
   - Verify virtual environment activation

3. **API Connection Issues**:
   - Check service health endpoints
   - Verify authentication tokens
   - Check network connectivity

### Debug Mode
```bash
# Enable debug logging
export DEBUG=stats-service:*
pnpm run dev:advanced-stats
```

## Future Enhancements

### Planned Features
1. **Real-time Collaboration**: Multi-user workflow editing
2. **Cloud Integration**: Connect to cloud data sources
3. **Advanced ML**: Deep learning and neural networks
4. **Report Generation**: Automated analysis reports
5. **Dashboard Creation**: Interactive data dashboards

### Extensibility
- **Custom Widgets**: Create specialized analysis widgets
- **Plugin Architecture**: Third-party plugin support
- **API Extensions**: Custom API endpoints
- **Theme System**: Customizable user interface

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check service health at `/health`
4. Review logs for error details

## Contributing

To contribute to the statistical analysis software:
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## License

This statistical analysis software is part of the Digital Research Manager project and follows the same licensing terms.
