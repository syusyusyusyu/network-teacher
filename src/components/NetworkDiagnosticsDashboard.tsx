import React, { useState } from 'react';
import { 
  Server, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Wifi, 
  WifiOff, 
  Shield, 
  Settings, 
  TerminalSquare, 
  RefreshCw,
  Layers,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Play,
  Clipboard
} from 'lucide-react';

// Mock data for simulation
const DUMMY_ROUTER = {
  name: "Cisco 892",
  ip: "192.168.1.1",
  model: "C892FSP-K9",
  serialNumber: "FTX1840ABCD",
  firmwareVersion: "15.7(3)M2",
  uptime: "10 days, 4 hours, 32 minutes"
};

const INTERFACE_STATUSES = {
  healthy: {
    GigabitEthernet0: { status: "up", protocol: "up", ip: "192.168.1.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet1: { status: "up", protocol: "up", ip: "10.0.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet2: { status: "up", protocol: "up", ip: "172.16.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet3: { status: "administratively down", protocol: "down", ip: "unassigned", speed: "auto", duplex: "auto" }
  },
  interfaceDown: {
    GigabitEthernet0: { status: "up", protocol: "up", ip: "192.168.1.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet1: { status: "down", protocol: "down", ip: "10.0.0.1", speed: "auto", duplex: "auto" },
    GigabitEthernet2: { status: "up", protocol: "up", ip: "172.16.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet3: { status: "administratively down", protocol: "down", ip: "unassigned", speed: "auto", duplex: "auto" }
  },
  ipMisconfigured: {
    GigabitEthernet0: { status: "up", protocol: "up", ip: "192.168.1.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet1: { status: "up", protocol: "up", ip: "10.0.0.254", speed: "1000Mb/s", duplex: "full" }, // IP mismatch
    GigabitEthernet2: { status: "up", protocol: "up", ip: "172.16.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet3: { status: "administratively down", protocol: "down", ip: "unassigned", speed: "auto", duplex: "auto" }
  },
  aclMisconfigured: {
    GigabitEthernet0: { status: "up", protocol: "up", ip: "192.168.1.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet1: { status: "up", protocol: "up", ip: "10.0.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet2: { status: "up", protocol: "up", ip: "172.16.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet3: { status: "administratively down", protocol: "down", ip: "unassigned", speed: "auto", duplex: "auto" }
  }
};

const ACL_CONFIGURATIONS = {
  healthy: [
    { name: "ALLOW_WEB", entries: ["permit tcp any any eq 80", "permit tcp any any eq 443"] },
    { name: "BLOCK_TELNET", entries: ["deny tcp any any eq 23", "permit ip any any"] }
  ],
  misconfigured: [
    { name: "ALLOW_WEB", entries: ["permit tcp any any eq 80", "permit tcp any any eq 443"] },
    { name: "BLOCK_ALL", entries: ["deny ip any any"] } // This ACL blocks all traffic
  ]
};

const PING_RESULTS = {
  healthy: {
    "192.168.1.2": { success: true, packetLoss: 0, rttMin: 0.5, rttAvg: 1.2, rttMax: 2.1 },
    "10.0.0.2": { success: true, packetLoss: 0, rttMin: 1.1, rttAvg: 2.3, rttMax: 3.7 }
  },
  interfaceDown: {
    "192.168.1.2": { success: true, packetLoss: 0, rttMin: 0.5, rttAvg: 1.2, rttMax: 2.1 },
    "10.0.0.2": { success: false, packetLoss: 100, rttMin: 0, rttAvg: 0, rttMax: 0 }
  },
  ipMisconfigured: {
    "192.168.1.2": { success: true, packetLoss: 0, rttMin: 0.5, rttAvg: 1.2, rttMax: 2.1 },
    "10.0.0.2": { success: false, packetLoss: 100, rttMin: 0, rttAvg: 0, rttMax: 0 }
  },
  aclMisconfigured: {
    "192.168.1.2": { success: true, packetLoss: 0, rttMin: 0.5, rttAvg: 1.2, rttMax: 2.1 },
    "10.0.0.2": { success: false, packetLoss: 100, rttMin: 0, rttAvg: 0, rttMax: 0 }
  }
};

const TRACEROUTE_RESULTS = {
  healthy: {
    "10.0.0.2": [
      { hop: 1, ip: "192.168.1.1", rtt: 0.5 },
      { hop: 2, ip: "10.0.0.1", rtt: 1.2 },
      { hop: 3, ip: "10.0.0.2", rtt: 2.1 }
    ]
  },
  interfaceDown: {
    "10.0.0.2": [
      { hop: 1, ip: "192.168.1.1", rtt: 0.5 },
      { hop: 2, ip: "*", rtt: null },
      { hop: 3, ip: "*", rtt: null }
    ]
  },
  ipMisconfigured: {
    "10.0.0.2": [
      { hop: 1, ip: "192.168.1.1", rtt: 0.5 },
      { hop: 2, ip: "10.0.0.254", rtt: 1.3 }, // Different next hop
      { hop: 3, ip: "*", rtt: null }
    ]
  },
  aclMisconfigured: {
    "10.0.0.2": [
      { hop: 1, ip: "192.168.1.1", rtt: 0.5 },
      { hop: 2, ip: "10.0.0.1", rtt: 1.2 },
      { hop: 3, ip: "*", rtt: null } // Blocked by ACL
    ]
  }
};

const DIAGNOSTIC_RESULTS = {
  healthy: {
    status: "healthy",
    summary: "全てのシステムは正常に動作しています",
    issues: []
  },
  interfaceDown: {
    status: "error",
    summary: "インターフェースダウンを検出しました",
    issues: [
      {
        type: "interface_down",
        severity: "critical",
        description: "GigabitEthernet1 がダウンしています",
        recommendation: "物理接続を確認するか、'no shutdown'コマンドでインターフェースを有効にしてください"
      }
    ]
  },
  ipMisconfigured: {
    status: "error",
    summary: "IP設定エラーを検出しました",
    issues: [
      {
        type: "ip_mismatch",
        severity: "high",
        description: "GigabitEthernet1のIPアドレスが不一致: 期待値 10.0.0.1, 実際の値 10.0.0.254",
        recommendation: "'ip address 10.0.0.1 255.255.255.0'コマンドで正しいIPアドレスを設定してください"
      }
    ]
  },
  aclMisconfigured: {
    status: "warning",
    summary: "アクセスコントロールリストの問題を検出しました",
    issues: [
      {
        type: "acl_too_restrictive",
        severity: "high",
        description: "ACL 'BLOCK_ALL'がすべてのトラフィックをブロックしています",
        recommendation: "必要なトラフィックを許可するようにACL設定を見直して更新してください"
      }
    ]
  }
};

interface NetworkDiagnosticsDashboardProps {
  className?: string;
}

const NetworkDiagnosticsDashboard: React.FC<NetworkDiagnosticsDashboardProps> = ({ className = "" }) => {
  const [connected, setConnected] = useState(false);
  const [scenario, setScenario] = useState("healthy");
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  interface DiagnosticResult {
    status: string;
    summary: string;
    issues: {
      type: string;
      severity: string;
      description: string;
      recommendation: string;
    }[];
  }
  
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<'deviceInfo' | 'interfaces' | 'diagnostics' | 'terminal', boolean>>({
    deviceInfo: true,
    interfaces: true,
    diagnostics: true,
    terminal: false
  });

  // Toggle section expansion
  const toggleSection = (section: 'deviceInfo' | 'interfaces' | 'diagnostics' | 'terminal') => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  // Simulate connection to router
  const handleConnect = () => {
    setConnected(false);
    addTerminalLine("Connecting to Cisco 892 router at 192.168.1.1...");
    
    setTimeout(() => {
      addTerminalLine("Connection established");
      addTerminalLine("Authenticating...");
      
      setTimeout(() => {
        addTerminalLine("Authentication successful");
        addTerminalLine("Router# show version");
        addTerminalLine(`Cisco IOS Software, C800 Software (C800-UNIVERSALK9-M), Version 15.7(3)M2`);
        addTerminalLine(`ROM: System Bootstrap, Version 15.7(3r)M2`);
        addTerminalLine(`Router uptime is ${DUMMY_ROUTER.uptime}`);
        setConnected(true);
      }, 1000);
    }, 1500);
  };

  // Add line to terminal output
  const addTerminalLine = (line: string) => {
    setTerminalOutput(prev => [...prev, line]);
  };

  // Run diagnostics
  const runDiagnostics = () => {
    setIsRunningDiagnostics(true);
    setDiagnosticResults(null);
    
    // Clear terminal and add diagnostic commands
    setTerminalOutput([]);
    addTerminalLine("Router# show ip interface brief");
    
    // Show commands based on scenario
    setTimeout(() => {
      const interfaces = INTERFACE_STATUSES[scenario as keyof typeof INTERFACE_STATUSES];
      Object.entries(interfaces).forEach(([name, details]) => {
        addTerminalLine(`${name.padEnd(25)} ${details.status.padEnd(15)} ${details.protocol.padEnd(10)} ${details.ip}`);
      });
      
      addTerminalLine("\nRouter# ping 10.0.0.2");
      
      setTimeout(() => {
        const pingResult = PING_RESULTS[scenario as keyof typeof PING_RESULTS]["10.0.0.2"];
        if (pingResult.success) {
          addTerminalLine("Type escape sequence to abort.");
          addTerminalLine("Sending 5, 100-byte ICMP Echos to 10.0.0.2, timeout is 2 seconds:");
          addTerminalLine("!!!!!");
          addTerminalLine("Success rate is 100 percent (5/5), round-trip min/avg/max = 1.1/2.3/3.7 ms");
        } else {
          addTerminalLine("Type escape sequence to abort.");
          addTerminalLine("Sending 5, 100-byte ICMP Echos to 10.0.0.2, timeout is 2 seconds:");
          addTerminalLine(".....");
          addTerminalLine("Success rate is 0 percent (0/5)");
        }
        
        addTerminalLine("\nRouter# traceroute 10.0.0.2");
        
        setTimeout(() => {
          addTerminalLine("Type escape sequence to abort.");
          addTerminalLine("Tracing the route to 10.0.0.2");
          
          const tracerouteResult = TRACEROUTE_RESULTS[scenario as keyof typeof TRACEROUTE_RESULTS]["10.0.0.2"];
          tracerouteResult.forEach(hop => {
            if (hop.ip === "*") {
              addTerminalLine(`${hop.hop}  * * *`);
            } else {
              addTerminalLine(`${hop.hop}  ${hop.ip}  ${hop.rtt}ms`);
            }
          });
          
          addTerminalLine("\nRouter# show access-lists");
          
          setTimeout(() => {
            const acls = scenario === "aclMisconfigured" ? ACL_CONFIGURATIONS.misconfigured : ACL_CONFIGURATIONS.healthy;
            acls.forEach(acl => {
              addTerminalLine(`Extended IP access list ${acl.name}`);
              acl.entries.forEach((entry, i) => {
                addTerminalLine(`    ${i+10} ${entry}`);
              });
            });
            
            // Set diagnostic results
            setDiagnosticResults(DIAGNOSTIC_RESULTS[scenario as keyof typeof DIAGNOSTIC_RESULTS]);
            setIsRunningDiagnostics(false);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "up": return "text-green-500";
      case "down": return "text-red-500";
      case "administratively down": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={`w-full min-h-screen bg-gray-100 ${className}`}>
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Server className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Cisco 892 ネットワーク診断</h1>
          </div>
          
          <div className="flex space-x-2">
            <select 
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              disabled={isRunningDiagnostics}
            >
              <option value="healthy">正常システム</option>
              <option value="interfaceDown">インターフェースダウン</option>
              <option value="ipMisconfigured">IP設定ミス</option>
              <option value="aclMisconfigured">ACL設定ミス</option>
            </select>
            
            <button 
              className={`flex items-center px-4 py-2 rounded-md text-white font-medium transition-all ${
                connected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
              onClick={handleConnect}
              disabled={isRunningDiagnostics}
            >
              {connected ? (
                <>
                  <WifiOff className="h-5 w-5 mr-2" />
                  切断
                </>
              ) : (
                <>
                  <Wifi className="h-5 w-5 mr-2" />
                  接続
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className={`mb-6 p-4 rounded-lg border ${
          connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            {connected ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {connected ? 'ルーターに接続済み' : '未接続'}
              </h2>
              <p className="text-sm text-gray-600">
                {connected 
                  ? `Cisco 892ルーター (192.168.1.1) に接続されています` 
                  : '接続ボタンをクリックしてルーターへの接続を確立してください'}
              </p>
            </div>
            
            {connected && (
              <button 
                className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center font-medium"
                onClick={runDiagnostics}
                disabled={isRunningDiagnostics}
              >
                {isRunningDiagnostics ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    診断実行中...
                  </>
                ) : (
                  <>
                    <Activity className="h-5 w-5 mr-2" />
                    診断を実行
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Device Information */}
          <div className="col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div 
              className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
              onClick={() => toggleSection('deviceInfo')}
            >
              <div className="flex items-center">
                <Server className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="font-semibold text-gray-800">デバイス情報</h2>
              </div>
              {expandedSections.deviceInfo ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.deviceInfo && (
              <div className="p-4">
                {connected ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">モデル:</span>
                      <span className="font-medium">{DUMMY_ROUTER.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">シリアル番号:</span>
                      <span className="font-medium">{DUMMY_ROUTER.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IOSバージョン:</span>
                      <span className="font-medium">{DUMMY_ROUTER.firmwareVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IPアドレス:</span>
                      <span className="font-medium">{DUMMY_ROUTER.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">稼働時間:</span>
                      <span className="font-medium">{DUMMY_ROUTER.uptime}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24">
                    <p className="text-gray-500">接続するとデバイス情報が表示されます</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Interface Status */}
          <div className="col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div 
              className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
              onClick={() => toggleSection('interfaces')}
            >
              <div className="flex items-center">
                <Layers className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="font-semibold text-gray-800">インターフェース状態</h2>
              </div>
              {expandedSections.interfaces ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.interfaces && (
              <div className="p-4">
                {connected ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">インターフェース</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プロトコル</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IPアドレス</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">速度/デュプレックス</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(INTERFACE_STATUSES[scenario as keyof typeof INTERFACE_STATUSES]).map(([name, details]) => (
                          <tr key={name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${
                                details.status === "up" 
                                  ? "bg-green-100 text-green-800" 
                                  : details.status === "administratively down" 
                                    ? "bg-yellow-100 text-yellow-800" 
                                    : "bg-red-100 text-red-800"
                              }`}>
                                {details.status === "up" ? (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                ) : details.status === "administratively down" ? (
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                ) : (
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                )}
                                {details.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`${getStatusColor(details.protocol)}`}>
                                {details.protocol}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">{details.ip}</td>
                            <td className="px-4 py-3 text-sm">{details.speed}/{details.duplex}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-gray-500">接続するとインターフェース状態が表示されます</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Diagnostic Results */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
            onClick={() => toggleSection('diagnostics')}
          >
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="font-semibold text-gray-800">診断結果</h2>
            </div>
            {expandedSections.diagnostics ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSections.diagnostics && (
            <div className="p-4">
              {diagnosticResults ? (
                <div>
                  <div className={`mb-4 p-4 rounded-lg ${
                    diagnosticResults.status === "healthy" 
                      ? "bg-green-50 border border-green-200" 
                      : diagnosticResults.status === "warning"
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-red-50 border border-red-200"
                  }`}>
                    <div className="flex items-center">
                      {diagnosticResults.status === "healthy" ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                      ) : diagnosticResults.status === "warning" ? (
                        <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                      )}
                      <div>
                        <h3 className="text-lg font-medium">
                          {diagnosticResults.status === "healthy" ? "ネットワーク正常" : "問題を検出"}
                        </h3>
                        <p className="text-sm">
                          {diagnosticResults.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {diagnosticResults.issues.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">検出された問題:</h4>
                      {diagnosticResults.issues.map((issue: DiagnosticResult['issues'][number], index: number) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start">
                            {getSeverityIcon(issue.severity)}
                            <div className="ml-3">
                              <h5 className="font-medium">{issue.description}</h5>
                              <div className="mt-2 bg-gray-50 rounded-md p-3">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">推奨対応: </span>
                                  {issue.recommendation}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : isRunningDiagnostics ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                  <p className="text-lg font-medium text-gray-700">診断実行中...</p>
                  <p className="text-sm text-gray-500 mt-2">少々お待ちください</p>
                </div>
              ) : connected ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                    <Play className="h-8 w-8 text-indigo-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">診断実行の準備ができました</p>
                  <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                    「診断を実行」ボタンをクリックして、ネットワーク構成を分析し潜在的な問題を特定します。
                  </p>
                  <button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center font-medium"
                    onClick={runDiagnostics}
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    診断を実行
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <p className="text-gray-500">まずルーターに接続してください</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Terminal Output */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
            onClick={() => toggleSection('terminal')}
          >
            <div className="flex items-center">
              <TerminalSquare className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="font-semibold text-gray-800">ターミナル出力</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {terminalOutput.length > 0 && (
                <button 
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(terminalOutput.join('\n'));
                  }}
                >
                  <Clipboard className="h-3 w-3 mr-1" />
                  コピー
                </button>
              )}
              {expandedSections.terminal ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
          
          {expandedSections.terminal && (
            <div className="p-0">
              <div className="bg-gray-900 text-gray-100 font-mono text-sm p-4 overflow-x-auto rounded-b-lg max-h-96 overflow-y-auto">
                {terminalOutput.length > 0 ? (
                  terminalOutput.map((line, index) => (
                    <div key={index} className={line.startsWith("Router#") ? "text-green-400 mt-2" : ""}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 italic">ターミナル出力がここに表示されます</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm transition-all"
            disabled={!connected}
          >
            <Zap className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">クイック診断</span>
          </button>
          
          <button 
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm transition-all"
            disabled={!connected}
          >
            <Shield className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">セキュリティ監査</span>
          </button>
          
          <button 
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm transition-all"
            disabled={!connected}
          >
            <Settings className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">設定</span>
          </button>
          
          <button 
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm transition-all"
            disabled={!connected || isRunningDiagnostics}
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <TerminalSquare className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">リモートターミナル</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagnosticsDashboard;