import React, { useState, useEffect } from 'react';
import { CalculatorIcon, ArrowRightIcon, RefreshIcon, BookmarkIcon, HistoryIcon } from '../components/icons';

interface ConversionCategory {
  name: string;
  units: Unit[];
}

interface Unit {
  name: string;
  symbol: string;
  category: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

interface ConversionHistory {
  id: string;
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  category: string;
  timestamp: Date;
}

const UnitConverterPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('length');
  const [fromUnit, setFromUnit] = useState<string>('');
  const [toUnit, setToUnit] = useState<string>('');
  const [fromValue, setFromValue] = useState<string>('1');
  const [toValue, setToValue] = useState<string>('');
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Define conversion categories and units
  const conversionCategories: ConversionCategory[] = [
    {
      name: 'length',
      units: [
        { name: 'Meter', symbol: 'm', category: 'length', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Kilometer', symbol: 'km', category: 'length', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { name: 'Centimeter', symbol: 'cm', category: 'length', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        { name: 'Millimeter', symbol: 'mm', category: 'length', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Mile', symbol: 'mi', category: 'length', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
        { name: 'Yard', symbol: 'yd', category: 'length', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
        { name: 'Foot', symbol: 'ft', category: 'length', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        { name: 'Inch', symbol: 'in', category: 'length', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
        { name: 'Micrometer', symbol: 'μm', category: 'length', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Nanometer', symbol: 'nm', category: 'length', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 },
        { name: 'Angstrom', symbol: 'Å', category: 'length', toBase: (v) => v / 10000000000, fromBase: (v) => v * 10000000000 }
      ]
    },
    {
      name: 'mass',
      units: [
        { name: 'Kilogram', symbol: 'kg', category: 'mass', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Gram', symbol: 'g', category: 'mass', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Milligram', symbol: 'mg', category: 'mass', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Microgram', symbol: 'μg', category: 'mass', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 },
        { name: 'Pound', symbol: 'lb', category: 'mass', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
        { name: 'Ounce', symbol: 'oz', category: 'mass', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
        { name: 'Ton', symbol: 't', category: 'mass', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 }
      ]
    },
    {
      name: 'volume',
      units: [
        { name: 'Liter', symbol: 'L', category: 'volume', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Milliliter', symbol: 'mL', category: 'volume', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Microliter', symbol: 'μL', category: 'volume', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Cubic Meter', symbol: 'm³', category: 'volume', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { name: 'Cubic Centimeter', symbol: 'cm³', category: 'volume', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Gallon', symbol: 'gal', category: 'volume', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
        { name: 'Quart', symbol: 'qt', category: 'volume', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
        { name: 'Pint', symbol: 'pt', category: 'volume', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
        { name: 'Cup', symbol: 'cup', category: 'volume', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 }
      ]
    },
    {
      name: 'temperature',
      units: [
        { name: 'Celsius', symbol: '°C', category: 'temperature', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
        { name: 'Fahrenheit', symbol: '°F', category: 'temperature', toBase: (v) => (v - 32) * 5/9 + 273.15, fromBase: (v) => (v - 273.15) * 9/5 + 32 },
        { name: 'Kelvin', symbol: 'K', category: 'temperature', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Rankine', symbol: '°R', category: 'temperature', toBase: (v) => v * 5/9, fromBase: (v) => v * 9/5 }
      ]
    },
    {
      name: 'pressure',
      units: [
        { name: 'Pascal', symbol: 'Pa', category: 'pressure', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Kilopascal', symbol: 'kPa', category: 'pressure', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { name: 'Megapascal', symbol: 'MPa', category: 'pressure', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
        { name: 'Bar', symbol: 'bar', category: 'pressure', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
        { name: 'Atmosphere', symbol: 'atm', category: 'pressure', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
        { name: 'PSI', symbol: 'psi', category: 'pressure', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
        { name: 'Torr', symbol: 'Torr', category: 'pressure', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 }
      ]
    },
    {
      name: 'concentration',
      units: [
        { name: 'Molar', symbol: 'M', category: 'concentration', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Millimolar', symbol: 'mM', category: 'concentration', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Micromolar', symbol: 'μM', category: 'concentration', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Nanomolar', symbol: 'nM', category: 'concentration', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 },
        { name: 'Percent', symbol: '%', category: 'concentration', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        { name: 'Parts per Million', symbol: 'ppm', category: 'concentration', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Parts per Billion', symbol: 'ppb', category: 'concentration', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 }
      ]
    }
  ];

  // Set default units when category changes
  useEffect(() => {
    const category = conversionCategories.find(cat => cat.name === selectedCategory);
    if (category && category.units.length >= 2) {
      setFromUnit(category.units[0].symbol);
      setToUnit(category.units[1].symbol);
    }
  }, [selectedCategory]);

  // Perform conversion when inputs change
  useEffect(() => {
    if (fromUnit && toUnit && fromValue && !isNaN(Number(fromValue))) {
      const category = conversionCategories.find(cat => cat.name === selectedCategory);
      if (category) {
        const fromUnitObj = category.units.find(unit => unit.symbol === fromUnit);
        const toUnitObj = category.units.find(unit => unit.symbol === toUnit);
        
        if (fromUnitObj && toUnitObj) {
          const baseValue = fromUnitObj.toBase(Number(fromValue));
          const convertedValue = toUnitObj.fromBase(baseValue);
          setToValue(convertedValue.toFixed(6).replace(/\.?0+$/, ''));
        }
      }
    }
  }, [fromValue, fromUnit, toUnit, selectedCategory]);

  const handleConversion = () => {
    if (fromUnit && toUnit && fromValue && toValue) {
      const newConversion: ConversionHistory = {
        id: Date.now().toString(),
        fromValue: Number(fromValue),
        fromUnit,
        toValue: Number(toValue),
        toUnit,
        category: selectedCategory,
        timestamp: new Date()
      };
      
      setConversionHistory(prev => [newConversion, ...prev.slice(0, 9)]);
    }
  };

  const toggleFavorite = (unitSymbol: string) => {
    setFavorites(prev => 
      prev.includes(unitSymbol) 
        ? prev.filter(fav => fav !== unitSymbol)
        : [...prev, unitSymbol]
    );
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue);
  };

  const clearInputs = () => {
    setFromValue('1');
    setToValue('');
  };

  const getCurrentCategory = () => conversionCategories.find(cat => cat.name === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <CalculatorIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unit Converter</h1>
              <p className="text-gray-600">Convert between different measurement units for scientific calculations</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Converter */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Conversion Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {conversionCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversion Inputs */}
              <div className="space-y-6">
                {/* From Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={fromValue}
                      onChange={(e) => setFromValue(e.target.value)}
                      placeholder="Enter value"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={fromUnit}
                      onChange={(e) => setFromUnit(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getCurrentCategory()?.units.map((unit) => (
                        <option key={unit.symbol} value={unit.symbol}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conversion Arrow */}
                <div className="flex justify-center">
                  <button
                    onClick={swapUnits}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    title="Swap units"
                  >
                    <ArrowRightIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* To Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={toValue}
                      readOnly
                      className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <select
                      value={toUnit}
                      onChange={(e) => setToUnit(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getCurrentCategory()?.units.map((unit) => (
                        <option key={unit.symbol} value={unit.symbol}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleConversion}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Convert
                  </button>
                  <button
                    onClick={clearInputs}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Clear inputs"
                  >
                    <RefreshIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Conversion History */}
            {conversionHistory.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HistoryIcon className="w-5 h-5 mr-2" />
                  Recent Conversions
                </h3>
                <div className="space-y-3">
                  {conversionHistory.map((conversion) => (
                    <div key={conversion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">{conversion.fromValue} {conversion.fromUnit}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-medium">{conversion.toValue} {conversion.toUnit}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {conversion.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Favorites */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookmarkIcon className="w-5 h-5 mr-2" />
                Favorite Units
              </h3>
              {favorites.length === 0 ? (
                <p className="text-gray-500 text-sm">No favorite units yet. Click the bookmark icon next to units to add them here.</p>
              ) : (
                <div className="space-y-2">
                  {favorites.map((unitSymbol) => {
                    const unit = getCurrentCategory()?.units.find(u => u.symbol === unitSymbol);
                    return unit ? (
                      <div key={unitSymbol} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">{unit.name}</span>
                        <button
                          onClick={() => toggleFavorite(unitSymbol)}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          <BookmarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Quick Conversions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Conversions</h3>
              <div className="space-y-3">
                {[
                  { from: '1 km', to: '0.621 mi', category: 'length' },
                  { from: '1 kg', to: '2.205 lb', category: 'mass' },
                  { from: '1 L', to: '0.264 gal', category: 'volume' },
                  { from: '0 °C', to: '32 °F', category: 'temperature' },
                  { from: '1 atm', to: '101.325 kPa', category: 'pressure' },
                  { from: '1 M', to: '1000 mM', category: 'concentration' }
                ].map((conversion, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded-lg">
                    <div className="font-medium">{conversion.from}</div>
                    <div className="text-gray-500">= {conversion.to}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Tips</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Use the swap button to quickly reverse conversions</li>
                <li>• Bookmark frequently used units for quick access</li>
                <li>• All conversions are performed in real-time</li>
                <li>• Results are automatically rounded for readability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitConverterPage;
