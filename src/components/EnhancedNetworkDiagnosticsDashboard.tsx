import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Activity, AlertCircle, CheckCircle, Wifi, WifiOff, Shield, 
  Settings, TerminalSquare, RefreshCw, Layers, Zap, AlertTriangle,
  ChevronDown, ChevronRight, Info, Play, Clipboard, Network, 
  Router as RouterIcon, Laptop, Table, Route,
  BarChart
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
  routingProblem: {
    GigabitEthernet0: { status: "up", protocol: "up", ip: "192.168.1.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet1: { status: "up", protocol: "up", ip: "10.0.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet2: { status: "up", protocol: "up", ip: "172.16.0.1", speed: "1000Mb/s", duplex: "full" },
    GigabitEthernet3: { status: "up", protocol: "up", ip: "192.168.2.1", speed: "1000Mb/s", duplex: "full" }
  }
};

// Routing tables for different scenarios
const ROUTING_TABLES = {
  healthy: [
    { destination: "0.0.0.0/0", nextHop: "203.0.113.1", interface: "GigabitEthernet1", protocol: "S", metric: 1, type: "Default route" },
    { destination: "10.0.0.0/24", nextHop: "Connected", interface: "GigabitEthernet1", protocol: "C", metric: 0, type: "Direct" },
    { destination: "172.16.0.0/24", nextHop: "Connected", interface: "GigabitEthernet2", protocol: "C", metric: 0, type: "Direct" },
    { destination: "192.168.1.0/24", nextHop: "Connected", interface: "GigabitEthernet0", protocol: "C", metric: 0, type: "Direct" },
    { destination: "192.168.2.0/24", nextHop: "Connected", interface: "GigabitEthernet3", protocol: "C", metric: 0, type: "Direct" },
    { destination: "192.168.3.0/24", nextHop: "10.0.0.2", interface: "GigabitEthernet1", protocol: "S", metric: 1, type: "Static" }
  ],
  routingProblem: [
    { destination: "0.0.0.0/0", nextHop: "203.0.113.1", interface: "GigabitEthernet1", protocol: "S", metric: 1, type: "Default route" },
    { destination: "10.0.0.0/24", nextHop: "Connected", interface: "GigabitEthernet1", protocol: "C", metric: 0, type: "Direct" },
    { destination: "172.16.0.0/24", nextHop: "Connected", interface: "GigabitEthernet2", protocol: "C", metric: 0, type: "Direct" },
    { destination: "192.168.1.0/24", nextHop: "Connected", interface: "GigabitEthernet0", protocol: "C", metric: 0, type: "Direct" },
    { destination: "192.168.2.0/24", nextHop: "Connected", interface: "GigabitEthernet3", protocol: "C", metric: 0, type: "Direct" },
    // Missing route to 192.168.3.0/24
  ]
};

// Mock topology data for PC-Router-Router-PC
const NETWORK_TOPOLOGIES = {
  healthy: {
    devices: [
      { id: "pc1", type: "pc", label: "PC1", ip: "192.168.1.10", connected: true },
      { id: "router1", type: "router", label: "Cisco 892", ip: "192.168.1.1", interfaces: ["192.168.1.1", "10.0.0.1", "172.16.0.1", "192.168.2.1"], connected: true },
      { id: "router2", type: "router", label: "Router2", ip: "10.0.0.2", interfaces: ["10.0.0.2", "192.168.3.1"], connected: true },
      { id: "pc2", type: "pc", label: "PC2", ip: "192.168.3.10", connected: true }
    ],
    links: [
      { source: "pc1", target: "router1", status: "up", bandwidth: "1Gbps", utilization: 5, latency: 0.5, label: "Local Network" },
      { source: "router1", target: "router2", status: "up", bandwidth: "100Mbps", utilization: 25, latency: 12, label: "WAN Link" },
      { source: "router2", target: "pc2", status: "up", bandwidth: "1Gbps", utilization: 3, latency: 0.5, label: "Remote Network" }
    ],
    paths: {
      "pc1-to-pc2": [
        { node: "pc1", ip: "192.168.1.10", status: "ok" },
        { node: "router1", ip: "192.168.1.1", status: "ok" },
        { node: "router1", ip: "10.0.0.1", status: "ok" },
        { node: "router2", ip: "10.0.0.2", status: "ok" },
        { node: "router2", ip: "192.168.3.1", status: "ok" },
        { node: "pc2", ip: "192.168.3.10", status: "ok" }
      ]
    }
  },
  interfaceDown: {
    devices: [
      { id: "pc1", type: "pc", label: "PC1", ip: "192.168.1.10", connected: true },
      { id: "router1", type: "router", label: "Cisco 892", ip: "192.168.1.1", interfaces: ["192.168.1.1", "10.0.0.1", "172.16.0.1", "192.168.2.1"], connected: true },
      { id: "router2", type: "router", label: "Router2", ip: "10.0.0.2", interfaces: ["10.0.0.2", "192.168.3.1"], connected: false },
      { id: "pc2", type: "pc", label: "PC2", ip: "192.168.3.10", connected: false }
    ],
    links: [
      { source: "pc1", target: "router1", status: "up", bandwidth: "1Gbps", utilization: 2, latency: 0.5, label: "Local Network" },
      { source: "router1", target: "router2", status: "down", bandwidth: "100Mbps", utilization: 0, latency: null, label: "WAN Link" },
      { source: "router2", target: "pc2", status: "unknown", bandwidth: "1Gbps", utilization: 0, latency: null, label: "Remote Network" }
    ],
    paths: {
      "pc1-to-pc2": [
        { node: "pc1", ip: "192.168.1.10", status: "ok" },
        { node: "router1", ip: "192.168.1.1", status: "ok" },
        { node: "router1", ip: "10.0.0.1", status: "error" },
        { node: "router2", ip: "10.0.0.2", status: "unreachable" },
        { node: "router2", ip: "192.168.3.1", status: "unreachable" },
        { node: "pc2", ip: "192.168.3.10", status: "unreachable" }
      ]
    }
  },
  ipMisconfigured: {
    devices: [
      { id: "pc1", type: "pc", label: "PC1", ip: "192.168.1.10", connected: true },
      { id: "router1", type: "router", label: "Cisco 892", ip: "192.168.1.1", interfaces: ["192.168.1.1", "10.0.0.254", "172.16.0.1", "192.168.2.1"], connected: true },
      { id: "router2", type: "router", label: "Router2", ip: "10.0.0.2", interfaces: ["10.0.0.2", "192.168.3.1"], connected: true },
      { id: "pc2", type: "pc", label: "PC2", ip: "192.168.3.10", connected: false }
    ],
    links: [
      { source: "pc1", target: "router1", status: "up", bandwidth: "1Gbps", utilization: 2, latency: 0.5, label: "Local Network" },
      { source: "router1", target: "router2", status: "error", bandwidth: "100Mbps", utilization: 0, latency: null, label: "WAN Link" },
      { source: "router2", target: "pc2", status: "unknown", bandwidth: "1Gbps", utilization: 0, latency: null, label: "Remote Network" }
    ],
    paths: {
      "pc1-to-pc2": [
        { node: "pc1", ip: "192.168.1.10", status: "ok" },
        { node: "router1", ip: "192.168.1.1", status: "ok" },
        { node: "router1", ip: "10.0.0.254", status: "warning" }, // IP mismatch
        { node: "router2", ip: "10.0.0.2", status: "unreachable" },
        { node: "router2", ip: "192.168.3.1", status: "unreachable" },
        { node: "pc2", ip: "192.168.3.10", status: "unreachable" }
      ]
    }
  },
  routingProblem: {
    devices: [
      { id: "pc1", type: "pc", label: "PC1", ip: "192.168.1.10", connected: true },
      { id: "router1", type: "router", label: "Cisco 892", ip: "192.168.1.1", interfaces: ["192.168.1.1", "10.0.0.1", "172.16.0.1", "192.168.2.1"], connected: true },
      { id: "router2", type: "router", label: "Router2", ip: "10.0.0.2", interfaces: ["10.0.0.2", "192.168.3.1"], connected: true },
      { id: "pc2", type: "pc", label: "PC2", ip: "192.168.3.10", connected: true }
    ],
    links: [
      { source: "pc1", target: "router1", status: "up", bandwidth: "1Gbps", utilization: 2, latency: 0.5, label: "Local Network" },
      { source: "router1", target: "router2", status: "up", bandwidth: "100Mbps", utilization: 15, latency: 12, label: "WAN Link" },
      { source: "router2", target: "pc2", status: "up", bandwidth: "1Gbps", utilization: 3, latency: 0.5, label: "Remote Network" }
    ],
    paths: {
      "pc1-to-pc2": [
        { node: "pc1", ip: "192.168.1.10", status: "ok" },
        { node: "router1", ip: "192.168.1.1", status: "ok" },
        { node: "router1", ip: "10.0.0.1", status: "ok" },
        { node: "router2", ip: "10.0.0.2", status: "ok" },
        { node: "router2", ip: "192.168.3.1", status: "ok" },
        { node: "pc2", ip: "192.168.3.10", status: "unreachable" } // Can't reach due to missing route
      ]
    }
  }
};

// Define interface for diagnostic issues
interface DiagnosticIssue {
  type: string;
  severity: string;
  description: string;
  recommendation: string;
}

// Define interface for diagnostic results
interface DiagnosticResult {
  status: string;
  summary: string;
  issues: DiagnosticIssue[];
}

// Updated diagnostic results including routing problems
const DIAGNOSTIC_RESULTS: Record<string, DiagnosticResult> = {
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
  routingProblem: {
    status: "warning",
    summary: "ルーティングの問題を検出しました",
    issues: [
      {
        type: "missing_route",
        severity: "high",
        description: "192.168.3.0/24ネットワークへのルートが見つかりません",
        recommendation: "'ip route 192.168.3.0 255.255.255.0 10.0.0.2'コマンドでスタティックルートを追加してください"
      }
    ]
  }
};

// TracerouteComponentProps interface
interface TracerouteComponentProps {
  scenario: string;
  source: string;
  destination: string;
}

// Traceroute visualization component
const TracerouteComponent: React.FC<TracerouteComponentProps> = ({ scenario, source, destination }) => {
  const topology = NETWORK_TOPOLOGIES[scenario as keyof typeof NETWORK_TOPOLOGIES];
  const path = topology?.paths['pc1-to-pc2'] || [];
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Route className="h-5 w-5 text-indigo-600 mr-2" />
        トレースルート: {source} → {destination}
      </h3>
      
      <div className="space-y-2">
        {path.map((hop, index) => (
          <div 
            key={index}
            className={`flex items-center p-2 rounded ${
              hop.status === 'ok' 
                ? 'bg-green-50' 
                : hop.status === 'warning' 
                  ? 'bg-yellow-50' 
                  : hop.status === 'error' 
                    ? 'bg-red-50' 
                    : 'bg-gray-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
              hop.status === 'ok' 
                ? 'bg-green-100 text-green-800' 
                : hop.status === 'warning' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : hop.status === 'error' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
            }`}>
              {index + 1}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center">
                {hop.node.includes('router') ? (
                  <RouterIcon className="h-4 w-4 mr-1 text-gray-600" />
                ) : (
                  <Laptop className="h-4 w-4 mr-1 text-gray-600" />
                )}
                <span className="font-medium">{hop.node}</span>
              </div>
              <div className="text-xs font-mono text-gray-500">{hop.ip}</div>
            </div>
            
            <div>
              {hop.status === 'ok' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {hop.status === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              {hop.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {hop.status === 'unreachable' && (
                <XCircleIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
            
            {index < path.length - 1 && (
              <div className="absolute left-[27px] mt-[30px] h-[calc(100%-30px)] border-l-2 border-gray-200 border-dashed"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// XCircleIcon for 'unreachable' status
const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

// Network Topology visualization component
const NetworkTopologyView: React.FC<{ scenario: string }> = ({ scenario }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode] = useState<string | null>(null);
  const [hoveredLink] = useState<string | null>(null);
  
  const topology = NETWORK_TOPOLOGIES[scenario as keyof typeof NETWORK_TOPOLOGIES];
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate positions
    const nodePositions: { [key: string]: { x: number, y: number } } = {};
    
    // Position PC1 at left, Router1 center-left, Router2 center-right, PC2 right
    nodePositions["pc1"] = { x: 100, y: canvas.height / 2 };
    nodePositions["router1"] = { x: canvas.width / 3, y: canvas.height / 2 };
    nodePositions["router2"] = { x: (canvas.width / 3) * 2, y: canvas.height / 2 };
    nodePositions["pc2"] = { x: canvas.width - 100, y: canvas.height / 2 };
    
    // Draw links first (so they appear behind nodes)
    topology.links.forEach(link => {
      const source = nodePositions[link.source];
      const target = nodePositions[link.target];
      
      // Set line style based on link status
      if (link.status === "up") {
        ctx.strokeStyle = "#10b981"; // green
        ctx.lineWidth = 3;
      } else if (link.status === "down") {
        ctx.strokeStyle = "#ef4444"; // red
        ctx.lineWidth = 3;
      } else if (link.status === "error") {
        ctx.strokeStyle = "#f59e0b"; // amber
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]); // dashed line for error
      } else {
        ctx.strokeStyle = "#9ca3af"; // gray
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]); // dotted line for unknown
      }
      
      // Draw link
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
      
      // Draw link label
      if (link.label) {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2 - 15;
        
        ctx.fillStyle = "#4b5563"; // gray-600
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(link.label, midX, midY);
        
        // Draw bandwidth and latency if available
        if (link.bandwidth) {
          ctx.fillStyle = "#6b7280"; // gray-500
          ctx.font = "10px sans-serif";
          ctx.fillText(`${link.bandwidth}${link.latency ? ` - ${link.latency}ms` : ''}`, midX, midY + 15);
        }
      }
    });
    
    // Draw nodes
    topology.devices.forEach(device => {
      const pos = nodePositions[device.id];
      
      // Draw circle based on device type
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      
      if (device.connected) {
        if (device.type === "router") {
          ctx.fillStyle = "#3b82f6"; // blue-500 for routers
        } else {
          ctx.fillStyle = "#10b981"; // emerald-500 for PCs
        }
      } else {
        ctx.fillStyle = "#9ca3af"; // gray-400 for disconnected
      }
      
      ctx.fill();
      
      // Draw device icon
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      if (device.type === "router") {
        ctx.fillText("R", pos.x, pos.y);
      } else {
        ctx.fillText("PC", pos.x, pos.y);
      }
      
      // Draw device label
      ctx.fillStyle = "#1f2937"; // gray-800
      ctx.font = "12px sans-serif";
      ctx.fillText(device.label, pos.x, pos.y + 35);
      
      // Draw IP address
      ctx.fillStyle = "#4b5563"; // gray-600
      ctx.font = "10px sans-serif";
      ctx.fillText(device.ip, pos.x, pos.y + 50);
    });
    
  }, [scenario, topology, hoveredNode, hoveredLink]);
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Network className="h-5 w-5 text-indigo-600 mr-2" />
        ネットワークトポロジ
      </h3>
      
      <div className="relative mt-2 bg-gray-50 rounded-lg border border-gray-200">
        <canvas 
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-auto"
        />
        
        <div className="absolute top-2 right-2 bg-white rounded-md shadow-sm p-2 text-xs">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span>リンク正常</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span>リンクダウン</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
            <span>リンクエラー</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
            <span>不明/未接続</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Routing Table component
const RoutingTableComponent: React.FC<{ scenario: string }> = ({ scenario }) => {
  const routes = ROUTING_TABLES[scenario as keyof typeof ROUTING_TABLES] || [];
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Table className="h-5 w-5 text-indigo-600 mr-2" />
        ルーティングテーブル
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">宛先ネットワーク</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">次ホップ</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">インターフェース</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プロトコル</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メトリック</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイプ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm font-mono whitespace-nowrap">{route.destination}</td>
                <td className="px-3 py-2 text-sm font-mono whitespace-nowrap">{route.nextHop}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{route.interface}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    route.protocol === 'C' 
                      ? 'bg-green-100 text-green-800' 
                      : route.protocol === 'S'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {route.protocol === 'C' && 'Connected'}
                    {route.protocol === 'S' && 'Static'}
                    {route.protocol === 'O' && 'OSPF'}
                    {route.protocol === 'R' && 'RIP'}
                    {route.protocol === 'B' && 'BGP'}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{route.metric}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{route.type}</td>
              </tr>
            ))}
            
            {/* Show missing route in problem scenario */}
            {scenario === 'routingProblem' && (
              <tr className="bg-red-50">
                <td className="px-3 py-2 text-sm font-mono whitespace-nowrap text-red-700">192.168.3.0/24</td>
                <td className="px-3 py-2 text-sm font-mono whitespace-nowrap text-red-700">—</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap text-red-700">—</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap text-red-700">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    未設定
                  </span>
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap text-red-700">—</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap text-red-700">不足しているルート</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Traffic Analysis component
const TrafficAnalysisComponent: React.FC<{ scenario: string }> = ({ scenario }) => {
  const topology = NETWORK_TOPOLOGIES[scenario as keyof typeof NETWORK_TOPOLOGIES];
  const links = topology?.links || [];
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <BarChart className="h-5 w-5 text-indigo-600 mr-2" />
        トラフィック分析
      </h3>
      
      {links.map((link, index) => (
        <div key={index} className="mb-4 last:mb-0">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm font-medium text-gray-700">
              {link.source} → {link.target}
              <span className="ml-2 text-xs text-gray-500">{link.label}</span>
            </div>
            <div className="text-xs text-gray-500">
              {link.status === 'up' ? (
                <span className="inline-flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  アクティブ
                </span>
              ) : link.status === 'down' ? (
                <span className="inline-flex items-center text-red-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  ダウン
                </span>
              ) : (
                <span className="inline-flex items-center text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  問題あり
                </span>
              )}
            </div>
          </div>
          
          {link.status === 'up' && (
            <>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>使用率: {link.utilization}%</span>
                <span>帯域幅: {link.bandwidth}</span>
                <span>遅延: {link.latency}ms</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    link.utilization < 30 
                      ? 'bg-green-500' 
                      : link.utilization < 70 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${link.utilization}%` }}
                ></div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

interface NetworkDiagnosticsDashboardProps {
  className?: string;
}

const EnhancedNetworkDiagnosticsDashboard: React.FC<NetworkDiagnosticsDashboardProps> = ({ className = "" }) => {
  const [connected, setConnected] = useState(false);
  const [scenario, setScenario] = useState("healthy");
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    deviceInfo: true,
    topology: true,
    interfaces: true,
    routing: true,
    traceroute: true,
    traffic: true,
    diagnostics: true,
    terminal: false
  });

  // Toggle section expansion
  const toggleSection = (section: string) => {
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
      
      // Show routing table
      addTerminalLine("\nRouter# show ip route");
      setTimeout(() => {
        addTerminalLine("Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP");
        addTerminalLine("       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area");
        addTerminalLine("       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2");
        addTerminalLine("       E1 - OSPF external type 1, E2 - OSPF external type 2\n");
        
        const routes = ROUTING_TABLES[scenario as keyof typeof ROUTING_TABLES] || [];
        routes.forEach(route => {
          addTerminalLine(`${route.protocol} ${route.destination} [${route.metric}/0] via ${route.nextHop}, ${route.interface}`);
        });
        
        // Ping test
        addTerminalLine("\nRouter# ping 192.168.3.10");
        setTimeout(() => {
          if (scenario === 'healthy') {
            addTerminalLine("Type escape sequence to abort.");
            addTerminalLine("Sending 5, 100-byte ICMP Echos to 192.168.3.10, timeout is 2 seconds:");
            addTerminalLine("!!!!!");
            addTerminalLine("Success rate is 100 percent (5/5), round-trip min/avg/max = 13.5/14.7/16.2 ms");
          } else {
            addTerminalLine("Type escape sequence to abort.");
            addTerminalLine("Sending 5, 100-byte ICMP Echos to 192.168.3.10, timeout is 2 seconds:");
            addTerminalLine(".....");
            addTerminalLine("Success rate is 0 percent (0/5)");
          }
          
          // Traceroute test
          addTerminalLine("\nRouter# traceroute 192.168.3.10");
          setTimeout(() => {
            addTerminalLine("Type escape sequence to abort.");
            addTerminalLine("Tracing the route to 192.168.3.10");
            
            if (scenario === 'healthy') {
              addTerminalLine(" 1  192.168.1.1  0.512 ms");
              addTerminalLine(" 2  10.0.0.1  1.247 ms");
              addTerminalLine(" 3  10.0.0.2  12.158 ms");
              addTerminalLine(" 4  192.168.3.1  13.247 ms");
              addTerminalLine(" 5  192.168.3.10  14.125 ms");
            } else if (scenario === 'interfaceDown') {
              addTerminalLine(" 1  192.168.1.1  0.512 ms");
              addTerminalLine(" 2  10.0.0.1  * ms");
              addTerminalLine(" 3  * * *");
              addTerminalLine(" 4  * * *");
              addTerminalLine(" 5  * * *");
            setDiagnosticResults(DIAGNOSTIC_RESULTS[scenario]);
              addTerminalLine(" 1  192.168.1.1  0.512 ms");
              addTerminalLine(" 2  10.0.0.254  1.247 ms");
              addTerminalLine(" 3  * * *");
              addTerminalLine(" 4  * * *");
              addTerminalLine(" 5  * * *");
            } else if (scenario === 'routingProblem') {
              addTerminalLine(" 1  192.168.1.1  0.512 ms");
              addTerminalLine(" 2  10.0.0.1  1.247 ms");
              addTerminalLine(" 3  10.0.0.2  12.158 ms");
              addTerminalLine(" 4  192.168.3.1  13.247 ms");
              addTerminalLine(" 5  * * *");
            }
                      
            // Set diagnostic results
            setDiagnosticResults(DIAGNOSTIC_RESULTS[scenario as keyof typeof DIAGNOSTIC_RESULTS]);
            setIsRunningDiagnostics(false);
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
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
    <div className={`w-full bg-gray-100 ${className}`}>
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
              <option value="routingProblem">ルーティング問題</option>
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
                            <td className="px-4 py-3 text-sm font-mono">
                              {details.ip}
                              {scenario === 'ipMisconfigured' && details.ip === '10.0.0.254' && (
                                <span className="ml-2 text-xs text-red-600 font-normal">
                                  (期待値: 10.0.0.1)
                                </span>
                              )}
                            </td>
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
        
        {/* Network Topology */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
            onClick={() => toggleSection('topology')}
          >
            <div className="flex items-center">
              <Network className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="font-semibold text-gray-800">ネットワークトポロジ</h2>
            </div>
            {expandedSections.topology ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSections.topology && (
            <div className="p-4">
              {connected ? (
                <NetworkTopologyView scenario={scenario} />
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">接続するとネットワークトポロジが表示されます</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Routing Table */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
            onClick={() => toggleSection('routing')}
          >
            <div className="flex items-center">
              <Table className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="font-semibold text-gray-800">ルーティングテーブル</h2>
            </div>
            {expandedSections.routing ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSections.routing && (
            <div className="p-4">
              {connected ? (
                <RoutingTableComponent scenario={scenario} />
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">接続するとルーティングテーブルが表示されます</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Traceroute */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
            onClick={() => toggleSection('traceroute')}
          >
            <div className="flex items-center">
              <Route className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="font-semibold text-gray-800">経路追跡</h2>
            </div>
            {expandedSections.traceroute ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSections.traceroute && (
            <div className="p-4">
              {connected ? (
                <TracerouteComponent 
                  scenario={scenario} 
                  source="PC1 (192.168.1.10)" 
                  destination="PC2 (192.168.3.10)" 
                />
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">接続すると経路追跡情報が表示されます</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Traffic Analysis */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
            onClick={() => toggleSection('traffic')}
          >
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="font-semibold text-gray-800">トラフィック分析</h2>
            </div>
            {expandedSections.traffic ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSections.traffic && (
            <div className="p-4">
              {connected ? (
                <TrafficAnalysisComponent scenario={scenario} />
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">接続するとトラフィック分析が表示されます</p>
                </div>
              )}
            </div>
          )}
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
                      {diagnosticResults.issues.map((issue: DiagnosticIssue, index: number) => (
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
          >
            <TerminalSquare className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">リモートターミナル</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNetworkDiagnosticsDashboard;