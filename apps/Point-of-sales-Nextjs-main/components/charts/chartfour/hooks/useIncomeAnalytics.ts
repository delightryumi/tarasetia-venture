import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initialChartfourOptions } from '@/lib/charts';
import { ApexOptions } from 'apexcharts';
import { useCurrency } from '@/hooks/useCurrency';

export interface CategoryBreakdownItem {
  category: string;
  subcategory: string;
  grossIncome: number;
  taxIncome: number;
  netProfit: number;
}

export function useIncomeAnalytics() {
  const { formatCurrency } = useCurrency();
  const formatCurrencyRef = useRef(formatCurrency);
  
  useEffect(() => {
    formatCurrencyRef.current = formatCurrency;
  }, [formatCurrency]);

  const getLocalYYYYMMDD = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const getInitialMonthlyRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: getLocalYYYYMMDD(firstDay),
      end: getLocalYYYYMMDD(today)
    };
  };

  const initialRange = getInitialMonthlyRange();

  const [filterType, setFilterType] = useState<'daily' | 'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState<string>(initialRange.start);
  const [endDate, setEndDate] = useState<string>(initialRange.end);
  const [totalAlacarte, setTotalAlacarte] = useState<number>(0);
  const [totalBanquet, setTotalBanquet] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(10);
  const [serviceRate, setServiceRate] = useState<number>(0);
  const [taxRateIndividual, setTaxRateIndividual] = useState<number>(10);
  const [lostBreakageRate, setLostBreakageRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);

  const [alacarteChartData, setAlacarteChartData] = useState<any>({});
  const [banquetChartData, setBanquetChartData] = useState<any>({});
  const [alacarteSeries, setAlacarteSeries] = useState<any[]>([]);
  const [banquetSeries, setBanquetSeries] = useState<any[]>([]);
  const [alacarteMax, setAlacarteMax] = useState<number | undefined>(undefined);
  const [banquetMax, setBanquetMax] = useState<number | undefined>(undefined);
  const [chartOptions, setChartOptions] = useState<ApexOptions>(initialChartfourOptions);

  const handleFilterTypeChange = (type: 'daily' | 'monthly' | 'custom') => {
    setFilterType(type);
    if (type === 'daily') {
      const today = new Date();
      const dateStr = getLocalYYYYMMDD(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (type === 'monthly') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(getLocalYYYYMMDD(firstDay));
      setEndDate(getLocalYYYYMMDD(today));
    }
  };

  const generateDateRange = (start: string, end: string) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const dateArray: string[] = [];
    let currentDate = startDateObj;

    const isSameMonth =
      startDateObj.getFullYear() === endDateObj.getFullYear() &&
      startDateObj.getMonth() === endDateObj.getMonth();
    const isSameYear = startDateObj.getFullYear() === endDateObj.getFullYear();

    while (currentDate <= endDateObj) {
      let formattedDate: string;

      if (!isSameYear) {
        formattedDate = currentDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } else if (!isSameMonth) {
        formattedDate = currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      } else {
        formattedDate = currentDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
        });
      }

      if (!dateArray.includes(formattedDate)) {
        dateArray.push(formattedDate);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  useEffect(() => {
    const newCategories = generateDateRange(startDate, endDate);
    
    setChartOptions((prevOptions) => ({
      ...prevOptions,
      xaxis: {
        ...prevOptions.xaxis,
        categories: newCategories,
      },
      yaxis: {
        ...prevOptions.yaxis,
        labels: {
          formatter: (value) => formatCurrencyRef.current(value),
        },
      },
      tooltip: {
        ...prevOptions.tooltip,
        y: {
          formatter: (value) => formatCurrencyRef.current(value),
        },
      },
    }));
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/profit?start=${startDate}&end=${endDate}`
      );
      
      const formatGroupedArray = (arr: any[]) => {
        return (arr || []).reduce(
          (acc: any, curr: any) => {
            acc[curr.date] = {
              netIncome: curr.netIncome,
              taxIncome: curr.taxIncome,
              grossIncomeWithTax: curr.grossIncomeWithTax,
            };
            return acc;
          },
          {}
        );
      };

      const formattedAlacarteData = formatGroupedArray(response.data.alacarteGroupedData);
      const formattedBanquetData = formatGroupedArray(response.data.banquetGroupedData);

      setCategoryBreakdown(response.data.categoryBreakdown || []);
      setTaxRate(response.data.taxRate ?? 10);
      setServiceRate(response.data.serviceRate ?? 0);
      setTaxRateIndividual(response.data.taxRateIndividual ?? 10);
      setLostBreakageRate(response.data.lostBreakageRate ?? 0);

      setAlacarteChartData(formattedAlacarteData);
      setBanquetChartData(formattedBanquetData);
      setTotalAlacarte(response.data.summary?.totalAlacarte ?? 0);
      setTotalBanquet(response.data.summary?.totalBanquet ?? 0);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const getSeriesAndMax = (chartData: any, startDateStr: string, endDateStr: string) => {
    const dateStrings: string[] = [];
    const startObj = new Date(startDateStr);
    const endObj = new Date(endDateStr);
    let cur = new Date(startObj.getTime());

    while (cur <= endObj) {
      const dateStr = cur.toISOString().split('T')[0];
      dateStrings.push(dateStr);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const netIncomeData = dateStrings.map((d) =>
      Number((chartData[d]?.netIncome || 0).toFixed(1))
    );
    const taxIncomeData = dateStrings.map((d) =>
      Number((chartData[d]?.taxIncome || 0).toFixed(1))
    );
    const grossIncomeWithTaxData = dateStrings.map((d) =>
      Number((chartData[d]?.grossIncomeWithTax || 0).toFixed(1))
    );
    const maxVal = grossIncomeWithTaxData.length > 0 ? Math.max(...grossIncomeWithTaxData) + 1 : 100;

    return {
      series: [
        { name: 'Net Profit', data: netIncomeData },
        { name: 'Pajak', data: taxIncomeData },
        { name: 'Omset Kotor', data: grossIncomeWithTaxData },
      ],
      max: maxVal
    };
  };

  useEffect(() => {
    const res = getSeriesAndMax(alacarteChartData, startDate, endDate);
    setAlacarteSeries(res.series);
    setAlacarteMax(res.max);
  }, [alacarteChartData, startDate, endDate]);

  useEffect(() => {
    const res = getSeriesAndMax(banquetChartData, startDate, endDate);
    setBanquetSeries(res.series);
    setBanquetMax(res.max);
  }, [banquetChartData, startDate, endDate]);

  const totalGrossIncome = categoryBreakdown.reduce((acc, curr) => acc + curr.grossIncome, 0);
  const totalTaxIncome = categoryBreakdown.reduce((acc, curr) => acc + curr.taxIncome, 0);
  const totalNetProfit = categoryBreakdown.reduce((acc, curr) => acc + curr.netProfit, 0);

  const nettRevenue = totalGrossIncome - totalTaxIncome;
  const banquetRevenue = totalBanquet;
  const alacarteRevenue = totalAlacarte;

  const foodRevenue = categoryBreakdown
    .filter((item) => item.category.toUpperCase() === 'FOOD')
    .reduce((acc, curr) => acc + curr.grossIncome, 0);

  const beverageRevenue = categoryBreakdown
    .filter((item) => item.category.toUpperCase() === 'BEVERAGE')
    .reduce((acc, curr) => acc + curr.grossIncome, 0);

  const otherRevenue = Math.max(0, alacarteRevenue - foodRevenue - beverageRevenue);

  const serviceCharge = taxRate > 0 ? (totalTaxIncome * serviceRate) / taxRate : 0;
  const taxAmount = taxRate > 0 ? (totalTaxIncome * taxRateIndividual) / taxRate : 0;
  const lostBreakageAmount = taxRate > 0 ? (totalTaxIncome * lostBreakageRate) / taxRate : 0;

  return {
    filterType,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    handleFilterTypeChange,
    loading,
    totalGrossIncome,
    totalTaxIncome,
    totalNetProfit,
    nettRevenue,
    banquetRevenue,
    alacarteRevenue,
    foodRevenue,
    beverageRevenue,
    otherRevenue,
    serviceCharge,
    taxAmount,
    lostBreakageAmount,
    serviceRate,
    taxRateIndividual,
    taxRate,
    lostBreakageRate,
    alacarteSeries,
    banquetSeries,
    alacarteMax,
    banquetMax,
    chartOptions,
    categoryBreakdown,
    totalAlacarte,
    totalBanquet,
  };
}
