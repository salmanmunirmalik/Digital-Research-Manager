from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import statsmodels.api as sm
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import io
import base64
import json
from datetime import datetime
import os

app = FastAPI(
    title="Advanced Statistical Analysis Service",
    description="Comprehensive statistical analysis and data mining service inspired by Orange3",
    version="2.0.0",
)

# Global settings
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class DataLoadRequest(BaseModel):
    file_path: str
    options: Dict[str, Any] = {}

class ColumnSelectionRequest(BaseModel):
    data: List[Dict[str, Any]]
    columns: List[str]

class MissingValuesRequest(BaseModel):
    data: List[Dict[str, Any]]
    method: str = 'drop'
    fill_value: Optional[Union[str, float, int]] = None

class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    columns: Optional[List[str]] = None
    options: Dict[str, Any] = {}

class RegressionRequest(BaseModel):
    data: List[Dict[str, Any]]
    target_column: str
    feature_columns: Optional[List[str]] = None

class ClusteringRequest(BaseModel):
    data: List[Dict[str, Any]]
    n_clusters: int = 3
    algorithm: str = 'kmeans'
    columns: Optional[List[str]] = None

class HypothesisTestRequest(BaseModel):
    data: List[Dict[str, Any]]
    test_type: str
    columns: List[str]
    options: Dict[str, Any] = {}

class ANOVARequest(BaseModel):
    data: List[Dict[str, Any]]
    group_column: str
    value_column: str

class VisualizationRequest(BaseModel):
    data: List[Dict[str, Any]]
    options: Dict[str, Any] = {}

class ExportRequest(BaseModel):
    data: List[Dict[str, Any]]
    file_path: str
    options: Dict[str, Any] = {}

def dataframe_to_dict(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Convert DataFrame to list of dictionaries for JSON serialization"""
    return df.to_dict('records')

def dict_to_dataframe(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """Convert list of dictionaries to DataFrame"""
    return pd.DataFrame(data)

def create_plot_image(fig) -> str:
    """Convert matplotlib figure to base64 image string"""
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    image_data = base64.b64encode(buffer.getvalue()).decode()
    buffer.close()
    plt.close(fig)
    return image_data

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "Advanced Statistical Analysis Service Healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "features": [
            "data_loading", "preprocessing", "descriptive_stats", 
            "correlation_analysis", "regression", "clustering",
            "hypothesis_testing", "anova", "visualization", "export"
        ]
    }

# Data Loading Endpoints
@app.post("/load-csv")
async def load_csv(request: DataLoadRequest):
    try:
        df = pd.read_csv(
            request.file_path,
            delimiter=request.options.get('delimiter', ','),
            header=0 if request.options.get('header', True) else None,
            encoding=request.options.get('encoding', 'utf-8')
        )
        
        return {
            "success": True,
            "data": dataframe_to_dict(df),
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load CSV: {str(e)}")

@app.post("/load-excel")
async def load_excel(request: DataLoadRequest):
    try:
        df = pd.read_excel(
            request.file_path,
            sheet_name=request.options.get('sheet_name', 0),
            header=0 if request.options.get('header', True) else None
        )
        
        return {
            "success": True,
            "data": dataframe_to_dict(df),
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load Excel: {str(e)}")

# Preprocessing Endpoints
@app.post("/data-info")
async def data_info(request: AnalysisRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        return {
            "success": True,
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "memory_usage": df.memory_usage(deep=True).sum(),
            "summary": {
                "numeric_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
                "categorical_columns": df.select_dtypes(include=['object']).columns.tolist(),
                "datetime_columns": df.select_dtypes(include=['datetime64']).columns.tolist()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get data info: {str(e)}")

@app.post("/select-columns")
async def select_columns(request: ColumnSelectionRequest):
    try:
        df = dict_to_dataframe(request.data)
        selected_df = df[request.columns]
        
        return {
            "success": True,
            "data": dataframe_to_dict(selected_df),
            "shape": selected_df.shape
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to select columns: {str(e)}")

@app.post("/remove-duplicates")
async def remove_duplicates(request: AnalysisRequest):
    try:
        df = dict_to_dataframe(request.data)
        subset = request.options.get('subset', None)
        
        original_shape = df.shape
        df_cleaned = df.drop_duplicates(subset=subset)
        duplicates_removed = original_shape[0] - df_cleaned.shape[0]
        
        return {
            "success": True,
            "data": dataframe_to_dict(df_cleaned),
            "duplicates_removed": duplicates_removed,
            "shape": df_cleaned.shape
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove duplicates: {str(e)}")

@app.post("/handle-missing")
async def handle_missing_values(request: MissingValuesRequest):
    try:
        df = dict_to_dataframe(request.data)
        original_missing = df.isnull().sum().sum()
        
        if request.method == 'drop':
            df_cleaned = df.dropna()
        elif request.method == 'fill':
            if request.fill_value is not None:
                df_cleaned = df.fillna(request.fill_value)
            else:
                df_cleaned = df.fillna(df.mean(numeric_only=True))
        else:
            df_cleaned = df
        
        missing_handled = original_missing - df_cleaned.isnull().sum().sum()
        
        return {
            "success": True,
            "data": dataframe_to_dict(df_cleaned),
            "missing_handled": missing_handled,
            "shape": df_cleaned.shape
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to handle missing values: {str(e)}")

# Statistical Analysis Endpoints
@app.post("/descriptive-stats")
async def descriptive_statistics(request: AnalysisRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        if request.columns:
            numeric_df = df[request.columns].select_dtypes(include=[np.number])
        else:
            numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            raise HTTPException(status_code=400, detail="No numeric columns found")
        
        stats_dict = {
            "count": numeric_df.count().to_dict(),
            "mean": numeric_df.mean().to_dict(),
            "std": numeric_df.std().to_dict(),
            "min": numeric_df.min().to_dict(),
            "max": numeric_df.max().to_dict(),
            "percentiles": {
                "25%": numeric_df.quantile(0.25).to_dict(),
                "50%": numeric_df.quantile(0.5).to_dict(),
                "75%": numeric_df.quantile(0.75).to_dict()
            },
            "skewness": numeric_df.skew().to_dict(),
            "kurtosis": numeric_df.kurtosis().to_dict()
        }
        
        return {
            "success": True,
            "statistics": stats_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate descriptive statistics: {str(e)}")

@app.post("/correlation-analysis")
async def correlation_analysis(request: AnalysisRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        if request.columns:
            numeric_df = df[request.columns].select_dtypes(include=[np.number])
        else:
            numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            raise HTTPException(status_code=400, detail="No numeric columns found")
        
        method = request.options.get('method', 'pearson')
        correlation_matrix = numeric_df.corr(method=method)
        
        # Calculate p-values for Pearson correlation
        p_values = None
        if method == 'pearson':
            n = len(numeric_df)
            p_values = {}
            for i, col1 in enumerate(correlation_matrix.columns):
                p_values[col1] = {}
                for j, col2 in enumerate(correlation_matrix.columns):
                    if i <= j:
                        corr_coef = correlation_matrix.loc[col1, col2]
                        if not np.isnan(corr_coef):
                            # Calculate p-value
                            t_stat = corr_coef * np.sqrt((n - 2) / (1 - corr_coef**2))
                            p_val = 2 * (1 - stats.t.cdf(abs(t_stat), n - 2))
                            p_values[col1][col2] = p_val
                        else:
                            p_values[col1][col2] = np.nan
                    else:
                        p_values[col1][col2] = p_values[col2][col1]
        
        return {
            "success": True,
            "correlation_matrix": correlation_matrix.to_dict(),
            "p_values": p_values,
            "method": method
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform correlation analysis: {str(e)}")

@app.post("/linear-regression")
async def linear_regression(request: RegressionRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        # Prepare target variable
        y = df[request.target_column]
        
        # Prepare feature variables
        if request.feature_columns:
            X = df[request.feature_columns].select_dtypes(include=[np.number])
        else:
            X = df.select_dtypes(include=[np.number]).drop(columns=[request.target_column])
        
        if X.empty:
            raise HTTPException(status_code=400, detail="No numeric feature columns found")
        
        # Add constant for intercept
        X_with_const = sm.add_constant(X)
        
        # Fit the model
        model = sm.OLS(y, X_with_const).fit()
        
        # Get predictions
        predictions = model.predict(X_with_const)
        residuals = y - predictions
        
        # Prepare results
        coefficients = model.params.to_dict()
        p_values = model.pvalues.to_dict()
        confidence_intervals = model.conf_int().to_dict()
        
        return {
            "success": True,
            "coefficients": coefficients,
            "intercept": coefficients.get('const', 0),
            "r_squared": model.rsquared,
            "adjusted_r_squared": model.rsquared_adj,
            "p_values": p_values,
            "confidence_intervals": confidence_intervals,
            "predictions": predictions.tolist(),
            "residuals": residuals.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform linear regression: {str(e)}")

@app.post("/clustering")
async def clustering_analysis(request: ClusteringRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        if request.columns:
            data = df[request.columns].select_dtypes(include=[np.number])
        else:
            data = df.select_dtypes(include=[np.number])
        
        if data.empty:
            raise HTTPException(status_code=400, detail="No numeric columns found")
        
        # Standardize the data
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(data)
        
        # Perform clustering
        if request.algorithm == 'kmeans':
            clusterer = KMeans(n_clusters=request.n_clusters, random_state=42)
        elif request.algorithm == 'dbscan':
            clusterer = DBSCAN()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported clustering algorithm: {request.algorithm}")
        
        labels = clusterer.fit_predict(data_scaled)
        
        # Calculate metrics
        if request.algorithm == 'kmeans':
            centers = scaler.inverse_transform(clusterer.cluster_centers_)
            inertia = clusterer.inertia_
        else:
            centers = None
            inertia = None
        
        silhouette = silhouette_score(data_scaled, labels) if len(set(labels)) > 1 else 0
        
        return {
            "success": True,
            "labels": labels.tolist(),
            "centers": centers.tolist() if centers is not None else None,
            "inertia": inertia,
            "silhouette_score": silhouette,
            "algorithm": request.algorithm,
            "n_clusters": request.n_clusters
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform clustering: {str(e)}")

@app.post("/hypothesis-testing")
async def hypothesis_testing(request: HypothesisTestRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        if len(request.columns) < 1:
            raise HTTPException(status_code=400, detail="At least one column required")
        
        # Select numeric columns
        data = df[request.columns].select_dtypes(include=[np.number])
        
        if data.empty:
            raise HTTPException(status_code=400, detail="No numeric columns found")
        
        results = {}
        
        if request.test_type == 'normality':
            # Shapiro-Wilk test for normality
            for col in data.columns:
                statistic, p_value = stats.shapiro(data[col].dropna())
                results[col] = {
                    "statistic": statistic,
                    "p_value": p_value,
                    "conclusion": "Normal" if p_value > 0.05 else "Not Normal"
                }
        
        elif request.test_type == 'ttest':
            # One-sample t-test
            if len(data.columns) == 1:
                col = data.columns[0]
                statistic, p_value = stats.ttest_1samp(data[col].dropna(), 
                                                     request.options.get('popmean', 0))
                results = {
                    "statistic": statistic,
                    "p_value": p_value,
                    "conclusion": "Significant" if p_value < 0.05 else "Not Significant"
                }
            elif len(data.columns) == 2:
                # Two-sample t-test
                col1, col2 = data.columns[0], data.columns[1]
                statistic, p_value = stats.ttest_ind(data[col1].dropna(), data[col2].dropna())
                results = {
                    "statistic": statistic,
                    "p_value": p_value,
                    "conclusion": "Significant difference" if p_value < 0.05 else "No significant difference"
                }
        
        elif request.test_type == 'mannwhitney':
            # Mann-Whitney U test
            if len(data.columns) == 2:
                col1, col2 = data.columns[0], data.columns[1]
                statistic, p_value = stats.mannwhitneyu(data[col1].dropna(), data[col2].dropna())
                results = {
                    "statistic": statistic,
                    "p_value": p_value,
                    "conclusion": "Significant difference" if p_value < 0.05 else "No significant difference"
                }
        
        return {
            "success": True,
            "test_results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform hypothesis testing: {str(e)}")

@app.post("/anova")
async def anova_analysis(request: ANOVARequest):
    try:
        df = dict_to_dataframe(request.data)
        
        # Group the data
        groups = df.groupby(request.group_column)[request.value_column].apply(list).tolist()
        
        # Perform one-way ANOVA
        f_statistic, p_value = stats.f_oneway(*groups)
        
        # Calculate degrees of freedom and sum of squares
        n_total = len(df)
        n_groups = len(groups)
        
        # Between groups
        grand_mean = df[request.value_column].mean()
        ss_between = sum(len(group) * (np.mean(group) - grand_mean)**2 for group in groups)
        df_between = n_groups - 1
        ms_between = ss_between / df_between
        
        # Within groups
        ss_within = sum(sum((x - np.mean(group))**2 for x in group) for group in groups)
        df_within = n_total - n_groups
        ms_within = ss_within / df_within
        
        return {
            "success": True,
            "f_statistic": f_statistic,
            "p_value": p_value,
            "df_between": df_between,
            "df_within": df_within,
            "ss_between": ss_between,
            "ss_within": ss_within,
            "ms_between": ms_between,
            "ms_within": ms_within
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform ANOVA: {str(e)}")

# Visualization Endpoints
@app.post("/scatter-plot")
async def create_scatter_plot(request: VisualizationRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        x_col = request.options.get('x_column')
        y_col = request.options.get('y_column')
        
        if not x_col or not y_col:
            raise HTTPException(status_code=400, detail="x_column and y_column required")
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Create scatter plot
        scatter = ax.scatter(df[x_col], df[y_col], alpha=0.6)
        
        # Add trend line
        z = np.polyfit(df[x_col], df[y_col], 1)
        p = np.poly1d(z)
        ax.plot(df[x_col], p(df[x_col]), "r--", alpha=0.8)
        
        ax.set_xlabel(request.options.get('x_label', x_col))
        ax.set_ylabel(request.options.get('y_label', y_col))
        ax.set_title(request.options.get('title', f'{y_col} vs {x_col}'))
        ax.grid(True, alpha=0.3)
        
        return {
            "success": True,
            "image_data": create_plot_image(fig)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create scatter plot: {str(e)}")

@app.post("/histogram")
async def create_histogram(request: VisualizationRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        column = request.options.get('column')
        if not column:
            raise HTTPException(status_code=400, detail="column required")
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Create histogram
        n, bins, patches = ax.hist(df[column].dropna(), bins=request.options.get('bins', 30), 
                                  alpha=0.7, edgecolor='black')
        
        ax.set_xlabel(request.options.get('x_label', column))
        ax.set_ylabel('Frequency')
        ax.set_title(request.options.get('title', f'Distribution of {column}'))
        ax.grid(True, alpha=0.3)
        
        return {
            "success": True,
            "image_data": create_plot_image(fig),
            "bins": bins.tolist(),
            "frequencies": n.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create histogram: {str(e)}")

@app.post("/box-plot")
async def create_box_plot(request: VisualizationRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        columns = request.options.get('columns', df.select_dtypes(include=[np.number]).columns.tolist())
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Create box plot
        data_for_box = [df[col].dropna() for col in columns]
        box_plot = ax.boxplot(data_for_box, labels=columns, patch_artist=True)
        
        ax.set_ylabel('Value')
        ax.set_title(request.options.get('title', 'Box Plot'))
        ax.grid(True, alpha=0.3)
        
        # Calculate statistics
        statistics = {}
        for i, col in enumerate(columns):
            data_col = df[col].dropna()
            statistics[col] = {
                'mean': data_col.mean(),
                'median': data_col.median(),
                'q1': data_col.quantile(0.25),
                'q3': data_col.quantile(0.75),
                'min': data_col.min(),
                'max': data_col.max()
            }
        
        return {
            "success": True,
            "image_data": create_plot_image(fig),
            "statistics": statistics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create box plot: {str(e)}")

@app.post("/heatmap")
async def create_heatmap(request: VisualizationRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        columns = request.options.get('columns', df.select_dtypes(include=[np.number]).columns.tolist())
        correlation_matrix = df[columns].corr()
        
        fig, ax = plt.subplots(figsize=(12, 10))
        
        # Create heatmap
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0,
                   square=True, ax=ax, cbar_kws={'shrink': 0.8})
        
        ax.set_title(request.options.get('title', 'Correlation Heatmap'))
        
        return {
            "success": True,
            "image_data": create_plot_image(fig),
            "correlation_matrix": correlation_matrix.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create heatmap: {str(e)}")

@app.post("/line-chart")
async def create_line_chart(request: VisualizationRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        x_col = request.options.get('x_column')
        y_col = request.options.get('y_column')
        
        if not x_col or not y_col:
            raise HTTPException(status_code=400, detail="x_column and y_column required")
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Sort by x column for proper line plotting
        df_sorted = df.sort_values(x_col)
        
        # Create line plot
        ax.plot(df_sorted[x_col], df_sorted[y_col], marker='o', linewidth=2, markersize=4)
        
        ax.set_xlabel(request.options.get('x_label', x_col))
        ax.set_ylabel(request.options.get('y_label', y_col))
        ax.set_title(request.options.get('title', f'{y_col} over {x_col}'))
        ax.grid(True, alpha=0.3)
        
        return {
            "success": True,
            "image_data": create_plot_image(fig)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create line chart: {str(e)}")

# Export Endpoints
@app.post("/export-csv")
async def export_csv(request: ExportRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(request.file_path), exist_ok=True)
        
        # Export to CSV
        df.to_csv(
            request.file_path,
            index=request.options.get('index', False),
            header=request.options.get('header', True),
            sep=request.options.get('delimiter', ',')
        )
        
        file_size = os.path.getsize(request.file_path)
        
        return {
            "success": True,
            "file_path": request.file_path,
            "size": file_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(e)}")

@app.post("/export-excel")
async def export_excel(request: ExportRequest):
    try:
        df = dict_to_dataframe(request.data)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(request.file_path), exist_ok=True)
        
        # Export to Excel
        df.to_excel(
            request.file_path,
            index=request.options.get('index', False),
            header=request.options.get('header', True),
            sheet_name=request.options.get('sheet_name', 'Sheet1')
        )
        
        file_size = os.path.getsize(request.file_path)
        
        return {
            "success": True,
            "file_path": request.file_path,
            "size": file_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export Excel: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
