from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Any
import asyncio
import random
import json
import logging
from datetime import datetime

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cisco 892 Network Diagnostics API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では特定のオリジンのみを許可する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データモデル
class RouterInfo(BaseModel):
    ip: str
    username: Optional[str] = None
    password: Optional[str] = None
    enable_password: Optional[str] = None
    connection_type: str = "ssh"  # ssh, telnet, snmp

class CommandRequest(BaseModel):
    command: str

class InterfaceInfo(BaseModel):
    name: str
    status: str
    protocol: str
    ip: str
    speed: str
    duplex: str

class PingResult(BaseModel):
    success: bool
    packet_loss: float
    rtt_min: float
    rtt_avg: float
    rtt_max: float

class TraceRouteHop(BaseModel):
    hop: int
    ip: str
    rtt: Optional[float] = None

class ACLEntry(BaseModel):
    name: str
    entries: List[str]

class DiagnosticIssue(BaseModel):
    type: str
    severity: str  # critical, high, medium, low
    description: str
    recommendation: str

class DiagnosticResult(BaseModel):
    status: str  # healthy, warning, error
    summary: str
    issues: List[DiagnosticIssue]

class ConnectionResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None

# 擬似データベース - 実際のシステムではデータベースを使用
connected_routers = {}
router_data = {
    "192.168.1.1": {
        "info": {
            "name": "Cisco 892",
            "model": "C892FSP-K9",
            "serial_number": "FTX1840ABCD",
            "firmware_version": "15.7(3)M2",
            "uptime": "10 days, 4 hours, 32 minutes"
        },
        "interfaces": {
            "GigabitEthernet0": {
                "name": "GigabitEthernet0",
                "status": "up", 
                "protocol": "up", 
                "ip": "192.168.1.1",
                "speed": "1000Mb/s",
                "duplex": "full"
            },
            "GigabitEthernet1": {
                "name": "GigabitEthernet1",
                "status": "up", 
                "protocol": "up", 
                "ip": "10.0.0.1",
                "speed": "1000Mb/s",
                "duplex": "full"
            },
            "GigabitEthernet2": {
                "name": "GigabitEthernet2",
                "status": "up", 
                "protocol": "up", 
                "ip": "172.16.0.1",
                "speed": "1000Mb/s",
                "duplex": "full"
            },
            "GigabitEthernet3": {
                "name": "GigabitEthernet3",
                "status": "administratively down", 
                "protocol": "down", 
                "ip": "unassigned",
                "speed": "auto",
                "duplex": "auto"
            }
        },
        "acls": [
            {
                "name": "ALLOW_WEB",
                "entries": [
                    "permit tcp any any eq 80",
                    "permit tcp any any eq 443"
                ]
            },
            {
                "name": "BLOCK_TELNET",
                "entries": [
                    "deny tcp any any eq 23",
                    "permit ip any any"
                ]
            }
        ]
    }
}

# シナリオ定義
scenarios = {
    "healthy": {
        "interfaces": {
            "GigabitEthernet0": {"status": "up", "protocol": "up"},
            "GigabitEthernet1": {"status": "up", "protocol": "up"},
            "GigabitEthernet2": {"status": "up", "protocol": "up"},
            "GigabitEthernet3": {"status": "administratively down", "protocol": "down"}
        },
        "ping_results": {
            "10.0.0.2": {"success": True, "packet_loss": 0, "rtt_min": 1.1, "rtt_avg": 2.3, "rtt_max": 3.7}
        },
        "traceroute_results": {
            "10.0.0.2": [
                {"hop": 1, "ip": "192.168.1.1", "rtt": 0.5},
                {"hop": 2, "ip": "10.0.0.1", "rtt": 1.2},
                {"hop": 3, "ip": "10.0.0.2", "rtt": 2.1}
            ]
        },
        "acls": [
            {"name": "ALLOW_WEB", "entries": ["permit tcp any any eq 80", "permit tcp any any eq 443"]},
            {"name": "BLOCK_TELNET", "entries": ["deny tcp any any eq 23", "permit ip any any"]}
        ],
        "diagnostic_result": {
            "status": "healthy",
            "summary": "全てのシステムは正常に動作しています",
            "issues": []
        }
    },
    "interface_down": {
        "interfaces": {
            "GigabitEthernet0": {"status": "up", "protocol": "up"},
            "GigabitEthernet1": {"status": "down", "protocol": "down"},
            "GigabitEthernet2": {"status": "up", "protocol": "up"},
            "GigabitEthernet3": {"status": "administratively down", "protocol": "down"}
        },
        "ping_results": {
            "10.0.0.2": {"success": False, "packet_loss": 100, "rtt_min": 0, "rtt_avg": 0, "rtt_max": 0}
        },
        "traceroute_results": {
            "10.0.0.2": [
                {"hop": 1, "ip": "192.168.1.1", "rtt": 0.5},
                {"hop": 2, "ip": "*", "rtt": None},
                {"hop": 3, "ip": "*", "rtt": None}
            ]
        },
        "acls": [
            {"name": "ALLOW_WEB", "entries": ["permit tcp any any eq 80", "permit tcp any any eq 443"]},
            {"name": "BLOCK_TELNET", "entries": ["deny tcp any any eq 23", "permit ip any any"]}
        ],
        "diagnostic_result": {
            "status": "error",
            "summary": "インターフェースダウンを検出しました",
            "issues": [
                {
                    "type": "interface_down",
                    "severity": "critical",
                    "description": "GigabitEthernet1 がダウンしています",
                    "recommendation": "物理接続を確認するか、'no shutdown'コマンドでインターフェースを有効にしてください"
                }
            ]
        }
    },
    "ip_misconfigured": {
        "interfaces": {
            "GigabitEthernet0": {"status": "up", "protocol": "up"},
            "GigabitEthernet1": {"status": "up", "protocol": "up", "ip": "10.0.0.254"},
            "GigabitEthernet2": {"status": "up", "protocol": "up"},
            "GigabitEthernet3": {"status": "administratively down", "protocol": "down"}
        },
        "ping_results": {
            "10.0.0.2": {"success": False, "packet_loss": 100, "rtt_min": 0, "rtt_avg": 0, "rtt_max": 0}
        },
        "traceroute_results": {
            "10.0.0.2": [
                {"hop": 1, "ip": "192.168.1.1", "rtt": 0.5},
                {"hop": 2, "ip": "10.0.0.254", "rtt": 1.3},
                {"hop": 3, "ip": "*", "rtt": None}
            ]
        },
        "acls": [
            {"name": "ALLOW_WEB", "entries": ["permit tcp any any eq 80", "permit tcp any any eq 443"]},
            {"name": "BLOCK_TELNET", "entries": ["deny tcp any any eq 23", "permit ip any any"]}
        ],
        "diagnostic_result": {
            "status": "error",
            "summary": "IP設定エラーを検出しました",
            "issues": [
                {
                    "type": "ip_mismatch",
                    "severity": "high",
                    "description": "GigabitEthernet1のIPアドレスが不一致: 期待値 10.0.0.1, 実際の値 10.0.0.254",
                    "recommendation": "'ip address 10.0.0.1 255.255.255.0'コマンドで正しいIPアドレスを設定してください"
                }
            ]
        }
    },
    "acl_misconfigured": {
        "interfaces": {
            "GigabitEthernet0": {"status": "up", "protocol": "up"},
            "GigabitEthernet1": {"status": "up", "protocol": "up"},
            "GigabitEthernet2": {"status": "up", "protocol": "up"},
            "GigabitEthernet3": {"status": "administratively down", "protocol": "down"}
        },
        "ping_results": {
            "10.0.0.2": {"success": False, "packet_loss": 100, "rtt_min": 0, "rtt_avg": 0, "rtt_max": 0}
        },
        "traceroute_results": {
            "10.0.0.2": [
                {"hop": 1, "ip": "192.168.1.1", "rtt": 0.5},
                {"hop": 2, "ip": "10.0.0.1", "rtt": 1.2},
                {"hop": 3, "ip": "*", "rtt": None}
            ]
        },
        "acls": [
            {"name": "ALLOW_WEB", "entries": ["permit tcp any any eq 80", "permit tcp any any eq 443"]},
            {"name": "BLOCK_ALL", "entries": ["deny ip any any"]}
        ],
        "diagnostic_result": {
            "status": "warning",
            "summary": "アクセスコントロールリストの問題を検出しました",
            "issues": [
                {
                    "type": "acl_too_restrictive",
                    "severity": "high",
                    "description": "ACL 'BLOCK_ALL'がすべてのトラフィックをブロックしています",
                    "recommendation": "必要なトラフィックを許可するようにACL設定を見直して更新してください"
                }
            ]
        }
    }
}

# 現在のシナリオ（デモ用）
current_scenario = "healthy"

# WebSocketクライアント管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

    async def send_json(self, data: Dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(data)

manager = ConnectionManager()

# ヘルパー関数
def apply_scenario(ip: str, scenario_name: str):
    global current_scenario
    current_scenario = scenario_name
    
    # 基本データを取得
    base_data = router_data.get(ip, {}).copy()
    
    # シナリオデータを適用
    scenario_data = scenarios.get(scenario_name, {})
    
    # インターフェース設定を更新
    if "interfaces" in base_data and "interfaces" in scenario_data:
        for interface, changes in scenario_data["interfaces"].items():
            if interface in base_data["interfaces"]:
                base_data["interfaces"][interface].update(changes)
    
    # ACL設定を更新
    if "acls" in scenario_data:
        base_data["acls"] = scenario_data["acls"]
    
    return base_data

# APIエンドポイント
@app.get("/")
async def root():
    return {"message": "Cisco 892 Network Diagnostics API"}

@app.post("/connect", response_model=ConnectionResponse)
async def connect_router(router: RouterInfo):
    logger.info(f"Connection request: {router}")
    
    # 実際のシステムではここでルーターへの接続処理を実装
    # テスト用に成功を返す
    session_id = f"session-{random.randint(1000, 9999)}"
    connected_routers[session_id] = {
        "ip": router.ip,
        "connected_at": datetime.now().isoformat(),
        "scenario": current_scenario
    }
    
    await asyncio.sleep(1)  # シミュレーション遅延
    
    return {
        "success": True,
        "message": f"Successfully connected to {router.ip}",
        "session_id": session_id
    }

@app.get("/scenarios")
async def get_scenarios():
    return {"scenarios": list(scenarios.keys())}

@app.post("/scenario/{scenario_name}")
async def set_scenario(scenario_name: str):
    global current_scenario
    if scenario_name not in scenarios:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_name} not found")
    
    current_scenario = scenario_name
    return {"message": f"Scenario set to {scenario_name}"}

@app.get("/router/{ip}/info")
async def get_router_info(ip: str):
    if ip not in router_data:
        raise HTTPException(status_code=404, detail=f"Router {ip} not found")
    
    await asyncio.sleep(0.5)  # シミュレーション遅延
    
    return router_data[ip]["info"]

@app.get("/router/{ip}/interfaces")
async def get_interfaces(ip: str):
    if ip not in router_data:
        raise HTTPException(status_code=404, detail=f"Router {ip} not found")
    
    # 現在のシナリオに基づいてデータを取得
    router_with_scenario = apply_scenario(ip, current_scenario)
    
    await asyncio.sleep(0.5)  # シミュレーション遅延
    
    return router_with_scenario["interfaces"]

@app.get("/router/{ip}/ping")
async def ping(ip: str, target: str):
    if ip not in router_data:
        raise HTTPException(status_code=404, detail=f"Router {ip} not found")
    
    await asyncio.sleep(1.5)  # シミュレーション遅延
    
    # 現在のシナリオからPing結果を取得
    scenario_data = scenarios.get(current_scenario, {})
    ping_results = scenario_data.get("ping_results", {})
    
    if target in ping_results:
        return ping_results[target]
    else:
        # デフォルトの成功結果
        return {
            "success": True,
            "packet_loss": 0,
            "rtt_min": 0.5,
            "rtt_avg": 1.2,
            "rtt_max": 2.1
        }

@app.get("/router/{ip}/traceroute")
async def traceroute(ip: str, target: str):
    if ip not in router_data:
        raise HTTPException(status_code=404, detail=f"Router {ip} not found")
    
    await asyncio.sleep(2)  # シミュレーション遅延
    
    # 現在のシナリオからTraceroute結果を取得
    scenario_data = scenarios.get(current_scenario, {})
    traceroute_results = scenario_data.get("traceroute_results", {})
    
    if target in traceroute_results:
        return traceroute_results[target]
    else:
        # デフォルトの結果
        return [
            {"hop": 1, "ip": "192.168.1.1", "rtt": 0.5},
            {"hop": 2, "ip": "10.0.0.1", "rtt": 1.2},
            {"hop": 3, "ip": target, "rtt": 2.1}
        ]

@app.get("/router/{ip}/acls")
async def get_acls(ip: str):
    if ip not in router_data:
        raise HTTPException(status_code=404, detail=f"Router {ip} not found")
    
    # 現在のシナリオに基づいてデータを取得
    router_with_scenario = apply_scenario(ip, current_scenario)
    
    await asyncio.sleep(0.5)  # シミュレーション遅延
    
    return router_with_scenario.get("acls", [])

@app.get("/router/{ip}/diagnostics")
async def run_diagnostics(ip: str):
    if ip not in router_data:
        raise HTTPException(status_code=404, detail=f"Router {ip} not found")
    
    await asyncio.sleep(3)  # シミュレーション遅延
    
    # 現在のシナリオからDiagnostic結果を取得
    scenario_data = scenarios.get(current_scenario, {})
    diagnostic_result = scenario_data.get("diagnostic_result", {})
    
    return diagnostic_result

@app.post("/router/{ip}/execute")
async def execute_command(ip: str, command_req: CommandRequest):
    if ip not in router_data:
        raise HTTPException(status_code=404, detail=f"Router {ip} not found")
    
    await asyncio.sleep(1)  # シミュレーション遅延
    
    command = command_req.command
    output = ""
    
    # 簡単なコマンド出力シミュレーション
    if "show version" in command:
        output = f"""Cisco IOS Software, C800 Software (C800-UNIVERSALK9-M), Version 15.7(3)M2
ROM: System Bootstrap, Version 15.7(3r)M2
Router uptime is 10 days, 4 hours, 32 minutes"""
    elif "show ip interface brief" in command:
        output = """Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0       192.168.1.1     YES NVRAM  up                    up
GigabitEthernet1       10.0.0.1        YES NVRAM  up                    up
GigabitEthernet2       172.16.0.1      YES NVRAM  up                    up
GigabitEthernet3       unassigned      YES NVRAM  administratively down down"""
    elif "show run" in command:
        output = """Building configuration...

Current configuration : 1278 bytes
!
version 15.7
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
!
hostname Router
!
interface GigabitEthernet0
 ip address 192.168.1.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet1
 ip address 10.0.0.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet2
 ip address 172.16.0.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet3
 no ip address
 shutdown
!
ip access-list extended ALLOW_WEB
 permit tcp any any eq 80
 permit tcp any any eq 443
!
ip access-list extended BLOCK_TELNET
 deny tcp any any eq 23
 permit ip any any
!
end"""
    else:
        output = f"Command executed: {command}"
    
    return {"output": output}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                command = message.get("command")
                
                if command == "ping":
                    # Pingコマンドのシミュレーション
                    target = message.get("target", "10.0.0.2")
                    
                    await manager.send_json({
                        "type": "command_start",
                        "command": f"ping {target}"
                    }, client_id)
                    
                    # 現在のシナリオからPing結果を取得
                    scenario_data = scenarios.get(current_scenario, {})
                    ping_results = scenario_data.get("ping_results", {})
                    result = ping_results.get(target, {"success": True, "packet_loss": 0})
                    
                    # Ping進行状況をシミュレート
                    for i in range(5):
                        if result["success"]:
                            await manager.send_json({
                                "type": "ping_progress",
                                "sequence": i + 1,
                                "success": True
                            }, client_id)
                        else:
                            await manager.send_json({
                                "type": "ping_progress",
                                "sequence": i + 1,
                                "success": False
                            }, client_id)
                        await asyncio.sleep(0.3)
                    
                    await manager.send_json({
                        "type": "command_result",
                        "command": "ping",
                        "result": result
                    }, client_id)
                
                elif command == "traceroute":
                    # Tracerouteコマンドのシミュレーション
                    target = message.get("target", "10.0.0.2")
                    
                    await manager.send_json({
                        "type": "command_start",
                        "command": f"traceroute {target}"
                    }, client_id)
                    
                    # 現在のシナリオからTraceroute結果を取得
                    scenario_data = scenarios.get(current_scenario, {})
                    traceroute_results = scenario_data.get("traceroute_results", {})
                    hops = traceroute_results.get(target, [])
                    
                    # Traceroute進行状況をシミュレート
                    for hop in hops:
                        await manager.send_json({
                            "type": "traceroute_progress",
                            "hop": hop
                        }, client_id)
                        await asyncio.sleep(0.5)
                    
                    await manager.send_json({
                        "type": "command_result",
                        "command": "traceroute",
                        "result": hops
                    }, client_id)
                
                elif command == "set_scenario":
                    # シナリオ変更
                    scenario_name = message.get("scenario")
                    if scenario_name in scenarios:
                        global current_scenario
                        current_scenario = scenario_name
                        await manager.send_json({
                            "type": "scenario_changed",
                            "scenario": scenario_name
                        }, client_id)
                    else:
                        await manager.send_json({
                            "type": "error",
                            "message": f"Invalid scenario: {scenario_name}"
                        }, client_id)
                
                else:
                    # その他のコマンド
                    await manager.send_json({
                        "type": "message",
                        "content": f"Received command: {command}"
                    }, client_id)
            
            except json.JSONDecodeError:
                await manager.send_personal_message(f"Invalid JSON: {data}", client_id)
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)