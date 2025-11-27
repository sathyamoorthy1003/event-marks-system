import React, { useState, useEffect } from "react";
import { CheckSquare, Square, FileArchive, FileType, Printer } from "lucide-react";
import { Button } from "../components/UIComponents";

const QRCodeManager = ({ teams, onSimulateScan, addToast, currentAppId }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [baseUrl, setBaseUrl] = useState(
    window.location.origin + window.location.pathname
  );

  useEffect(() => {
    if (!window.JSZip) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
    if (!window.docx) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/docx@7.1.0/build/index.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === teams.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(teams.map((t) => t.id)));
  };
  const getQrUrl = (teamCode) => {
    // Remove trailing slash if present
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}?team=${teamCode}&tenant=${currentAppId}`;
  };
  const downloadSingle = async (team) => {
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        getQrUrl(team.code)
      )}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `QR_${team.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("QR Code Downloaded", "success");
    } catch (e) {
      addToast("Error downloading QR", "error");
    }
  };
  const downloadZip = async () => {
    if (selectedIds.size === 0)
      return addToast("Select at least one team", "error");
    if (!window.JSZip) return addToast("Zip library loading...", "error");
    setIsProcessing(true);
    const zip = new window.JSZip();
    const folder = zip.folder("QR_Codes");
    const selectedTeams = teams.filter((t) => selectedIds.has(t.id));
    try {
      await Promise.all(
        selectedTeams.map(async (team) => {
          const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            getQrUrl(team.code)
          )}`;
          const response = await fetch(url);
          const blob = await response.blob();
          folder.file(
            `${team.code}_${team.name.replace(/\s+/g, "_")}.png`,
            blob
          );
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `QR_Codes_Batch.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Batch ZIP Downloaded", "success");
    } catch (e) {
      console.error(e);
      addToast("Error generating Zip", "error");
    }
    setIsProcessing(false);
  };
  const handlePrint = (team = null) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return addToast("Allow popups to print", "error");
    const styles = `body { font-family: sans-serif; padding: 20px; } .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; } .card { border: 1px dashed #ccc; padding: 30px; text-align: center; page-break-inside: avoid; border-radius: 12px; } .code { font-size: 28px; font-weight: 800; margin-bottom: 5px; display: block; letter-spacing: 2px; } .name { font-size: 20px; margin-bottom: 15px; font-weight: 600; } .img { width: 180px; height: 180px; } @media print { .no-print { display: none; } }`;
    const dataToPrint = team ? [team] : teams;
    const content = dataToPrint
      .map(
        (t) =>
          `<div class="card"><span class="code">${
            t.code
          }</span><div class="name">${
            t.name
          }</div><img class="img" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            getQrUrl(t.code)
          )}" /></div>`
      )
      .join("");
    printWindow.document.write(
      `<html><head><title>Print QR Codes</title><style>${styles}</style></head><body><h1 class="no-print">Print QR Codes</h1><div class="grid">${content}</div></body></html>`
    );
    printWindow.document.close();
  };
  const downloadWord = async () => {
    if (selectedIds.size === 0)
      return addToast("Select at least one team", "error");
    if (!window.docx) return addToast("Word generator loading...", "error");
    setIsProcessing(true);
    const selectedTeams = teams.filter((t) => selectedIds.has(t.id));
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      ImageRun,
      AlignmentType,
      HeadingLevel,
      PageBreak,
    } = window.docx;
    const children = [];
    for (let i = 0; i < selectedTeams.length; i++) {
      const team = selectedTeams[i];
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        getQrUrl(team.code)
      )}`;
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const arrayBuffer = await blob.arrayBuffer();
        children.push(
          new Paragraph({
            text: `${team.code}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: `${team.name}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: { width: 300, height: 300 },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
        if (i < selectedTeams.length - 1)
          children.push(new Paragraph({ children: [new PageBreak()] }));
      } catch (e) {
        console.error("Err fetching image", e);
      }
    }
    const doc = new Document({
      sections: [{ properties: {}, children: children }],
    });
    try {
      const blob = await Packer.toBlob(doc);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `QR_Codes_Doc.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Word Document Generated", "success");
    } catch (e) {
      console.error(e);
      addToast("Error creating Word doc", "error");
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            QR Code Management
          </h2>
          <p className="text-slate-500">
            Generate and batch download QR codes.
          </p>
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-100">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-bold text-blue-800 mb-1 block">
              QR Code Base URL (Important for Mobile Scanning)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., http://192.168.1.5:5173"
            />
            <p className="text-xs text-blue-600 mt-1">
              If scanning from mobile, replace "localhost" with your computer's
              IP address (e.g., http://192.168.x.x:5173).
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={toggleSelectAll}
            icon={
              selectedIds.size === teams.length && teams.length > 0
                ? CheckSquare
                : Square
            }
          >
            {selectedIds.size === teams.length && teams.length > 0
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button
            onClick={downloadZip}
            disabled={isProcessing || selectedIds.size === 0}
            icon={FileArchive}
          >
            {isProcessing ? "Processing..." : "Download ZIP"}
          </Button>
          <Button
            onClick={downloadWord}
            disabled={isProcessing || selectedIds.size === 0}
            icon={FileType}
          >
            {isProcessing ? "Generating..." : "Download DOCX"}
          </Button>
          <Button
            variant="secondary"
            icon={Printer}
            onClick={() => handlePrint()}
          >
            Print All (PDF)
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`relative bg-white rounded-xl border transition-all ${
              selectedIds.has(team.id)
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-slate-200"
            } shadow-sm hover:shadow-md p-6 flex flex-col items-center text-center space-y-4`}
          >
            <div className="absolute top-4 left-4">
              <input
                type="checkbox"
                checked={selectedIds.has(team.id)}
                onChange={() => toggleSelect(team.id)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div className="w-full font-mono text-2xl font-bold text-slate-800 tracking-wider border-b border-slate-100 pb-2 mt-2">
              {team.code}
            </div>
            <div className="w-full">
              <h3 className="font-bold text-lg text-slate-900 truncate">
                {team.name}
              </h3>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  getQrUrl(team.code)
                )}`}
                alt={`QR for ${team.name}`}
                className="w-32 h-32 object-contain"
              />
            </div>
            <div className="flex gap-2 w-full pt-2">
              <Button
                variant="secondary"
                className="flex-1 text-[10px] px-1"
                onClick={() => downloadSingle(team)}
              >
                Save PNG
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-[10px] px-1"
                onClick={() => handlePrint(team)}
              >
                Print
              </Button>
              <Button
                className="flex-1 text-[10px] px-1"
                onClick={() => onSimulateScan(team.code)}
              >
                Scan
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRCodeManager;
