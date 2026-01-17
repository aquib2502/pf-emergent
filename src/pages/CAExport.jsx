import { useState } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, FileSpreadsheet, CheckCircle, Folder, Landmark, Home, Coins, CreditCard, Receipt, TrendingUp } from "lucide-react";

export default function CAExport() {
  const { token } = useAuth();
  const [selectedYear, setSelectedYear] = useState("2024-25");
  const [downloading, setDownloading] = useState(false);

  const FINANCIAL_YEARS = ["2024-25", "2023-24", "2022-23"];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API}/export/ca-report?financial_year=${selectedYear}&token=${token}`, {
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ledgeros_ca_report_${selectedYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Report downloaded successfully");
    } catch (err) {
      toast.error("Failed to download report");
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const exportItems = [
    { icon: Landmark, label: "Bank Accounts", description: "All bank account details with current balances" },
    { icon: FileSpreadsheet, label: "Fixed Deposits", description: "FD details with principal, interest rates, maturity dates" },
    { icon: Folder, label: "Government Schemes", description: "PPF, NPS, EPF with contributions and balances" },
    { icon: Home, label: "Real Estate", description: "Property details with valuations and rental income" },
    { icon: Coins, label: "Gold Holdings", description: "Physical, digital gold and SGBs" },
    { icon: TrendingUp, label: "Investment Portfolio", description: "Stocks, mutual funds, and ETFs with P&L" },
    { icon: Receipt, label: "Loans", description: "Home loans, car loans with outstanding balances" },
    { icon: CreditCard, label: "Credit Cards", description: "Credit limits and outstanding dues" },
    { icon: FileText, label: "All Transactions", description: "Complete transaction history with categories" },
    { icon: CheckCircle, label: "Tax Deductions", description: "Section-wise breakdown of all tax deductions" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="ca-export-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CA Export</h1>
          <p className="text-gray-500 text-sm mt-1">Download comprehensive financial report for your CA</p>
        </div>
      </div>

      {/* Export Card */}
      <div className="card-surface p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
          <FileSpreadsheet size={40} className="text-blue-600" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Export Financial Report</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Generate a comprehensive Excel report containing all your financial data organized for your Chartered Accountant
        </p>

        <div className="flex items-center justify-center gap-4 mb-8">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[160px] bg-white" data-testid="export-year-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINANCIAL_YEARS.map(y => (<SelectItem key={y} value={y}>FY {y}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button size="lg" onClick={handleDownload} disabled={downloading} data-testid="download-report-btn">
            <Download size={18} className="mr-2" />
            {downloading ? "Generating..." : "Download Report"}
          </Button>
        </div>

        <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
          <FileSpreadsheet size={16} />
          <span>Format: Microsoft Excel (.xlsx)</span>
        </div>
      </div>

      {/* What's Included */}
      <div className="card-surface p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included in the Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className="text-blue-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="card-surface p-6 bg-amber-50 border-amber-200">
        <h3 className="text-lg font-semibold text-amber-900 mb-3">Tips for Best Results</h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
            <span>Ensure all your assets are updated with current market values</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
            <span>Categorize all transactions for accurate expense reporting</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
            <span>Add all tax-saving investments under the Tax Planning section</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
            <span>Update loan outstanding balances for accurate liability calculation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
