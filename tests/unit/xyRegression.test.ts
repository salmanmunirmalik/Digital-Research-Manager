import {
  analyzeXyRegression,
  exampleDataset,
  summarizeRow,
  type XyRegressionRow,
} from '../../utils/xyRegression';

describe('xyRegression', () => {
  it('ignores empty replicate cells (not as zero)', () => {
    const row: XyRegressionRow = {
      id: '1',
      xRaw: '2',
      readings: ['0.18', '', '0.20'],
    };
    const s = summarizeRow(row);
    expect(s.n).toBe(2);
    expect(s.mean).toBeCloseTo(0.19, 6);
    expect(s.sd).not.toBeNull();
  });

  it('marks SD unavailable when n = 1', () => {
    const s = summarizeRow({
      id: '1',
      xRaw: '1',
      readings: ['0.5', '', ''],
    });
    expect(s.n).toBe(1);
    expect(s.mean).toBe(0.5);
    expect(s.sd).toBeNull();
    expect(s.sem).toBeNull();
    expect(s.cvPercent).toBeNull();
  });

  it('fits regression on means, not raw replicates', () => {
    const analysis = analyzeXyRegression(exampleDataset());
    expect(analysis.meanPoints).toHaveLength(5);
    expect(analysis.replicatePoints.length).toBe(15);
    expect(analysis.regression).not.toBeNull();
    expect(analysis.regression!.n).toBe(5);
    expect(analysis.regression!.rSquared).toBeGreaterThan(0.99);
    // Slope roughly 0.084 from the example
    expect(analysis.regression!.slope).toBeGreaterThan(0.08);
    expect(analysis.regression!.slope).toBeLessThan(0.09);
  });

  it('warns on high CV', () => {
    const analysis = analyzeXyRegression(
      {
        ...exampleDataset(),
        rows: [
          {
            id: 'a',
            xRaw: '4',
            readings: ['0.1', '0.5', '0.9'],
          },
          {
            id: 'b',
            xRaw: '8',
            readings: ['0.2', '0.21', '0.19'],
          },
        ],
      },
      { cvWarnThreshold: 15, errorBars: 'sd' }
    );
    expect(analysis.warnings.some((w) => w.code === 'high_cv')).toBe(true);
  });

  it('blocks regression without X variation', () => {
    const analysis = analyzeXyRegression({
      ...exampleDataset(),
      rows: [
        { id: 'a', xRaw: '2', readings: ['0.1', '0.1', '0.1'] },
        { id: 'b', xRaw: '2', readings: ['0.2', '0.2', '0.2'] },
      ],
    });
    expect(analysis.canRegress).toBe(false);
    expect(analysis.warnings.some((w) => w.code === 'duplicate_x' || w.code === 'no_x_variation')).toBe(
      true
    );
  });
});
