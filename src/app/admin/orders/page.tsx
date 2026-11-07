"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  X,
  Plus,
  ShoppingBag,
  ExternalLink,
  Store,
  DollarSign,
  Tag,
  Camera,
  Image as ImageIcon,
  Package,
  UploadCloud,
  Trash2,
  FileText,
  Sparkles,
  Phone,
  Mail,
  MessageCircle,
  RefreshCw,
  User,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Update Status Form
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("Delhivery");
  const [internalNotes, setInternalNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // Edit Order Shipping & Delivery Form State
  const [editHasShipping, setEditHasShipping] = useState(false);
  const [editShippingCharge, setEditShippingCharge] = useState<number>(0);
  const [editAddressLine1, setEditAddressLine1] = useState("");
  const [editAddressLine2, setEditAddressLine2] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");

  // Tab Switcher: "orders" | "custom_requests"
  const [activeTab, setActiveTab] = useState<"orders" | "custom_requests">("orders");
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [customSearch, setCustomSearch] = useState("");
  const [customStatusFilter, setCustomStatusFilter] = useState("all");
  const [selectedCustomRequest, setSelectedCustomRequest] = useState<any | null>(null);
  const [updatingCustomId, setUpdatingCustomId] = useState<string | null>(null);
  const [convertingCustomRequestId, setConvertingCustomRequestId] = useState<string | null>(null);

  // Offline / Manual Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState("");
  const [uploadingPacking, setUploadingPacking] = useState(false);
  const [uploadingManualProductImg, setUploadingManualProductImg] = useState(false);
  const [uploadingManualPackingImg, setUploadingManualPackingImg] = useState(false);
  const [uploadingManualReceipt, setUploadingManualReceipt] = useState(false);
  const [uploadingAdminScreenshot, setUploadingAdminScreenshot] = useState(false);
  const [adminScreenshotSuccess, setAdminScreenshotSuccess] = useState("");
  const [viewingScreenshotModal, setViewingScreenshotModal] = useState<string | null>(null);

  // Deletion & Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Registered customers & Available website products
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedCustomerDropdownId, setSelectedCustomerDropdownId] = useState("");

  const [offlineForm, setOfflineForm] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    hasShipping: false,
    shippingCharge: 0,
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    orderSource: "offline" as "offline" | "exhibition" | "instagram" | "custom",
    paymentMethod: "cash" as "cash" | "upi" | "card" | "bank_transfer",
    paymentStatus: "paid" as "paid" | "unpaid",
    paymentScreenshotUrl: "",
    upiTransactionId: "",
    orderStatus: "confirmed" as "confirmed" | "processing" | "dispatched" | "shipped" | "delivered",
    items: [
      { productId: "", productName: "", quantity: 1, unitPrice: 0 },
    ],
    productImages: [] as string[],
    packingImages: [] as string[],
    discountAmount: 0,
    discountReason: "",
    orderNotes: "",
    internalNotes: "",
  });

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [uploadingEditReceipt, setUploadingEditReceipt] = useState(false);
  const [uploadingEditProductImg, setUploadingEditProductImg] = useState(false);
  const [uploadingEditPackingImg, setUploadingEditPackingImg] = useState(false);

  const [editForm, setEditForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    hasShipping: false,
    shippingCharge: 0,
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "India",
    orderSource: "offline",
    paymentMethod: "cash",
    paymentStatus: "paid",
    paymentScreenshotUrl: "",
    upiTransactionId: "",
    orderStatus: "confirmed",
    trackingNumber: "",
    courierName: "Delhivery",
    items: [] as Array<{
      id?: string;
      productId?: string | null;
      productName: string;
      variantName?: string | null;
      quantity: number;
      unitPrice: number;
      price?: number;
      totalPrice?: number;
      personalizationDetails?: any;
      referenceImageUrl?: string | null;
    }>,
    productImages: [] as string[],
    packingImages: [] as string[],
    discountAmount: 0,
    discountReason: "",
    subtotal: 0,
    totalAmount: 0,
    orderNotes: "",
    internalNotes: "",
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertCustomToOrder = (req: any) => {
    setConvertingCustomRequestId(req.id);
    const unitPrice = req.quoteAmount
      ? Number(req.quoteAmount)
      : req.budget
        ? Number(String(req.budget).replace(/[^0-9]/g, "")) || 1500
        : 1500;
    setOfflineForm({
      customerId: req.customerId || "",
      customerName: req.customerName || "",
      customerEmail: req.customerEmail || "",
      customerPhone: req.customerPhone || "",
      hasShipping: false,
      shippingCharge: 0,
      shippingAddressLine1: "",
      shippingAddressLine2: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      orderSource: "custom",
      paymentMethod: "upi",
      paymentStatus: "unpaid",
      paymentScreenshotUrl: "",
      upiTransactionId: "",
      orderStatus: "confirmed",
      items: [
        {
          productId: "",
          productName: req.productType ? `Custom ${req.productType}` : "Bespoke Custom Resin Art",
          quantity: 1,
          unitPrice,
        },
      ],
      productImages: req.referenceImageUrl ? [req.referenceImageUrl] : [],
      packingImages: [],
      discountAmount: 0,
      discountReason: "",
      orderNotes: `Custom Inquiry Brief: ${req.description}`,
      internalNotes: `Converted from Custom Studio Request (ID: ${req.id})`,
    });
    setShowCreateModal(true);
  };

  const loadCustomRequests = async () => {
    setLoadingCustom(true);
    try {
      const res = await fetch("/api/custom-requests");
      const data = await res.json();
      if (data && data.requests) {
        setCustomRequests(data.requests);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const convertCustomId = params.get("convertCustomId");
          if (convertCustomId) {
            const matched = data.requests.find((r: any) => r.id === convertCustomId);
            if (matched && matched.status !== "converted" && matched.status !== "converted_to_order") {
              handleConvertCustomToOrder(matched);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load custom requests:", e);
    } finally {
      setLoadingCustom(false);
    }
  };

  const handleUpdateCustomStatus = async (reqId: string, nextStatus: string) => {
    setUpdatingCustomId(reqId);
    try {
      const res = await fetch(`/api/admin/custom-requests/${reqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setCustomRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status: nextStatus } : r))
        );
        if (selectedCustomRequest?.id === reqId) {
          setSelectedCustomRequest((prev: any) => (prev ? { ...prev, status: nextStatus } : prev));
        }
      }
    } catch (err) {
      console.error("Failed to update custom request status:", err);
    } finally {
      setUpdatingCustomId(null);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomersList(data);
      }
    } catch (e) {
      console.error("Failed to load customers:", e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/admin/products?limit=200");
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        setProductsList(data.products);
      }
    } catch (e) {
      console.error("Failed to load products:", e);
    }
  };

  useEffect(() => {
    loadOrders();
    loadCustomRequests();
    loadCustomers();
    loadProducts();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "custom" || params.get("tab") === "custom_requests") {
        setActiveTab("custom_requests");
      }
    }
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all") {
      if (statusFilter === "dispatched") {
        if (o.orderStatus !== "dispatched" && o.orderStatus !== "shipped") return false;
      } else if (o.orderStatus !== statusFilter) {
        return false;
      }
    }
    if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
    if (sourceFilter !== "all") {
      const src = o.orderSource || "online";
      if (sourceFilter === "whatsapp" && src !== "whatsapp") return false;
      if (sourceFilter === "offline" && (src === "online" || src === "whatsapp")) return false;
      if (sourceFilter === "online" && src !== "online") return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const cleanEmail = o.customerEmail && !o.customerEmail.startsWith("offline_") ? o.customerEmail.toLowerCase() : "";
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        cleanEmail.includes(q) ||
        o.customerPhone?.includes(q)
      );
    }
    return true;
  });

  const handleDeleteSingleOrder = async (order: any) => {
    if (!order?.id) return;
    const orderNum = order.orderNumber || "this order";
    if (
      !confirm(
        `Are you sure you want to permanently remove order #${orderNum}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingOrderId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Order #${orderNum} has been permanently deleted.`);
        setTimeout(() => setActionMessage(""), 4000);
        if (selectedOrder?.id === order.id) setSelectedOrder(null);
        if (editingOrder?.id === order.id) setEditingOrder(null);
        setSelectedOrderIds((prev) => prev.filter((id) => id !== order.id));
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        alert(data.error || "Failed to delete order.");
      }
    } catch {
      alert("An error occurred while deleting the order.");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    if (
      !confirm(
        `Are you sure you want to permanently remove ${count} selected order${
          count > 1 ? "s" : ""
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedOrderIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Successfully removed ${count} order${count > 1 ? "s" : ""}.`);
        setTimeout(() => setActionMessage(""), 4000);
        setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
        setSelectedOrderIds([]);
      } else {
        alert(data.error || "Failed to delete selected orders.");
      }
    } catch {
      alert("An error occurred while deleting selected orders.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const openOrderModal = (ord: any) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setNewPaymentStatus(ord.paymentStatus);
    setTrackingNumber(ord.trackingNumber || "");
    setCourierName(ord.courierName || "Delhivery");
    setInternalNotes("");
    setUpdateMsg("");

    const addr1 = ord.shippingAddressLine1 || "";
    const hasShip = Number(ord.shippingCharge) > 0 || (
      Boolean(addr1 && addr1.trim()) &&
      !addr1.toLowerCase().includes("pick-up") &&
      !addr1.toLowerCase().includes("pickup") &&
      !addr1.toLowerCase().includes("walk-in") &&
      !addr1.toLowerCase().includes("direct handover")
    );
    setEditHasShipping(hasShip);
    setEditShippingCharge(hasShip ? Number(ord.shippingCharge || 0) : 0);
    setEditAddressLine1(hasShip ? addr1 : "");
    setEditAddressLine2(hasShip ? (ord.shippingAddressLine2 || "") : "");
    setEditCity(hasShip ? (ord.shippingCity || "") : "");
    setEditState(hasShip ? (ord.shippingState || "") : "");
    setEditPostalCode(hasShip ? (ord.shippingPostalCode || "") : "");

    if (!ord.items || ord.items.length === 0) {
      fetch(`/api/admin/orders/${ord.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.items) {
            setSelectedOrder((prev: any) => (prev ? { ...prev, ...data } : data));
          }
        })
        .catch(() => { });
    }
  };

  const openEditModal = (ord: any) => {
    const addr1 = ord.shippingAddressLine1 || "";
    const hasShip = Number(ord.shippingCharge) > 0 || (
      Boolean(addr1 && addr1.trim()) &&
      !addr1.toLowerCase().includes("pick-up") &&
      !addr1.toLowerCase().includes("pickup") &&
      !addr1.toLowerCase().includes("walk-in") &&
      !addr1.toLowerCase().includes("direct handover")
    );

    const cleanEmail = ord.customerEmail && !ord.customerEmail.startsWith("offline_") ? ord.customerEmail : "";

    const items = ord.items && ord.items.length > 0
      ? ord.items.map((it: any) => ({
          id: it.id,
          productId: it.productId || null,
          productName: it.productName || "Custom Resin Piece",
          variantName: it.variantName || "",
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice || it.price || 0),
          price: Number(it.unitPrice || it.price || 0),
          totalPrice: Number(it.totalPrice || (it.unitPrice || it.price || 0) * (it.quantity || 1)),
          personalizationDetails: it.personalizationDetails,
          referenceImageUrl: it.referenceImageUrl,
        }))
      : [{ productName: "Custom Resin Piece", quantity: 1, unitPrice: Number(ord.subtotal || ord.totalAmount || 0) }];

    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.unitPrice) * Number(it.quantity)), 0);
    const discount = Number(ord.discountAmount) || 0;
    const shipping = Number(ord.shippingCharge) || 0;
    const total = Math.max(0, subtotal - discount + (hasShip ? shipping : 0));

    setEditForm({
      customerName: ord.customerName || "",
      customerEmail: cleanEmail,
      customerPhone: ord.customerPhone || "",
      hasShipping: hasShip,
      shippingCharge: hasShip ? shipping : 0,
      shippingAddressLine1: hasShip ? (ord.shippingAddressLine1 || "") : "",
      shippingAddressLine2: hasShip ? (ord.shippingAddressLine2 || "") : "",
      shippingCity: hasShip ? (ord.shippingCity || "") : "",
      shippingState: hasShip ? (ord.shippingState || "") : "",
      shippingPostalCode: hasShip ? (ord.shippingPostalCode || "") : "",
      shippingCountry: hasShip ? (ord.shippingCountry || "India") : "",
      orderSource: ord.orderSource || "offline",
      paymentMethod: ord.paymentMethod || "cash",
      paymentStatus: ord.paymentStatus || "paid",
      paymentScreenshotUrl: ord.paymentScreenshotUrl || "",
      upiTransactionId: ord.upiTransactionId || "",
      orderStatus: ord.orderStatus || "confirmed",
      trackingNumber: ord.trackingNumber || "",
      courierName: ord.courierName || "Delhivery",
      items,
      productImages: ord.productImages || [],
      packingImages: ord.packingImages || [],
      discountAmount: discount,
      discountReason: ord.discountReason || "",
      subtotal,
      totalAmount: total,
      orderNotes: ord.orderNotes || "",
      internalNotes: ord.internalNotes || "",
    });

    setEditError("");
    setEditingOrder(ord);

    if (!ord.items || ord.items.length === 0) {
      fetch(`/api/admin/orders/${ord.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.items && data.items.length > 0) {
            const freshItems = data.items.map((it: any) => ({
              id: it.id,
              productId: it.productId || null,
              productName: it.productName || "Custom Resin Piece",
              variantName: it.variantName || "",
              quantity: Number(it.quantity) || 1,
              unitPrice: Number(it.unitPrice || it.price || 0),
              price: Number(it.unitPrice || it.price || 0),
              totalPrice: Number(it.totalPrice || (it.unitPrice || it.price || 0) * (it.quantity || 1)),
              personalizationDetails: it.personalizationDetails,
              referenceImageUrl: it.referenceImageUrl,
            }));
            const freshSub = freshItems.reduce((s: number, i: any) => s + (Number(i.unitPrice) * Number(i.quantity)), 0);
            setEditForm((prev) => ({
              ...prev,
              items: freshItems,
              subtotal: freshSub,
              totalAmount: Math.max(0, freshSub - prev.discountAmount + (prev.hasShipping ? prev.shippingCharge : 0)),
            }));
          }
        })
        .catch(() => {});
    }
  };

  const handleEditItemChange = (idx: number, field: string, value: any) => {
    const updated = [...editForm.items];
    updated[idx] = { ...updated[idx], [field]: value };
    const sub = updated.reduce((sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 1)), 0);
    const ship = editForm.hasShipping ? Number(editForm.shippingCharge || 0) : 0;
    const total = Math.max(0, sub - Number(editForm.discountAmount || 0) + ship);
    setEditForm({
      ...editForm,
      items: updated,
      subtotal: sub,
      totalAmount: total,
    });
  };

  const handleAddEditItem = () => {
    const updated = [...editForm.items, { productName: "Custom Resin Item", quantity: 1, unitPrice: 0 }];
    const sub = updated.reduce((sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 1)), 0);
    const ship = editForm.hasShipping ? Number(editForm.shippingCharge || 0) : 0;
    const total = Math.max(0, sub - Number(editForm.discountAmount || 0) + ship);
    setEditForm({
      ...editForm,
      items: updated,
      subtotal: sub,
      totalAmount: total,
    });
  };

  const handleRemoveEditItem = (idx: number) => {
    if (editForm.items.length <= 1) return;
    const updated = editForm.items.filter((_, i) => i !== idx);
    const sub = updated.reduce((sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 1)), 0);
    const ship = editForm.hasShipping ? Number(editForm.shippingCharge || 0) : 0;
    const total = Math.max(0, sub - Number(editForm.discountAmount || 0) + ship);
    setEditForm({
      ...editForm,
      items: updated,
      subtotal: sub,
      totalAmount: total,
    });
  };

  const handleUploadEditReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setEditForm((prev) => ({ ...prev, paymentScreenshotUrl: data.url }));
      }
    } catch {
      alert("Failed to upload receipt screenshot");
    } finally {
      setUploadingEditReceipt(false);
    }
  };

  const handleUploadEditProductImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingEditProductImg(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) urls.push(data.url);
      }
      setEditForm((prev) => ({
        ...prev,
        productImages: [...prev.productImages, ...urls],
      }));
    } catch {
      alert("Failed to upload product images");
    } finally {
      setUploadingEditProductImg(false);
    }
  };

  const handleUploadEditPackingImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingEditPackingImg(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) urls.push(data.url);
      }
      setEditForm((prev) => ({
        ...prev,
        packingImages: [...prev.packingImages, ...urls],
      }));
    } catch {
      alert("Failed to upload packing images");
    } finally {
      setUploadingEditPackingImg(false);
    }
  };

  const handleRemoveEditProductImg = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveEditPackingImg = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      packingImages: prev.packingImages.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveEditReceipt = () => {
    setEditForm((prev) => ({ ...prev, paymentScreenshotUrl: "" }));
  };

  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSavingEdit(true);
    setEditError("");

    try {
      const payload = {
        customerName: editForm.customerName,
        customerEmail: editForm.customerEmail.trim() ? editForm.customerEmail.trim() : null,
        customerPhone: editForm.customerPhone,
        shippingAddressLine1: editForm.hasShipping && editForm.shippingAddressLine1.trim()
          ? editForm.shippingAddressLine1.trim()
          : null,
        shippingAddressLine2: editForm.hasShipping && editForm.shippingAddressLine2?.trim()
          ? editForm.shippingAddressLine2.trim()
          : null,
        shippingCity: editForm.hasShipping && editForm.shippingCity.trim()
          ? editForm.shippingCity.trim()
          : null,
        shippingState: editForm.hasShipping && editForm.shippingState.trim()
          ? editForm.shippingState.trim()
          : null,
        shippingPostalCode: editForm.hasShipping && editForm.shippingPostalCode.trim()
          ? editForm.shippingPostalCode.trim()
          : null,
        shippingCountry: editForm.hasShipping && editForm.shippingAddressLine1.trim()
          ? (editForm.shippingCountry || "India")
          : null,
        orderSource: editForm.orderSource,
        paymentMethod: editForm.paymentMethod,
        paymentStatus: editForm.paymentStatus,
        orderStatus: editForm.orderStatus,
        trackingNumber: editForm.trackingNumber || null,
        courierName: editForm.courierName || null,
        upiTransactionId: editForm.upiTransactionId || null,
        paymentScreenshotUrl: editForm.paymentScreenshotUrl || null,
        orderNotes: editForm.orderNotes || null,
        internalNotes: editForm.internalNotes || null,
        items: editForm.items.map((i) => ({
          ...i,
          productName: i.productName.trim() || "Handmade Resin Art",
          quantity: Math.max(1, parseInt(String(i.quantity), 10) || 1),
          unitPrice: Math.max(0, parseFloat(String(i.unitPrice)) || 0),
          price: Math.max(0, parseFloat(String(i.unitPrice)) || 0),
          totalPrice: (Math.max(1, parseInt(String(i.quantity), 10) || 1)) * (Math.max(0, parseFloat(String(i.unitPrice)) || 0)),
        })),
        subtotal: Number(editForm.subtotal) || 0,
        discountAmount: Number(editForm.discountAmount) || 0,
        discountReason: editForm.discountReason?.trim() || null,
        shippingCharge: editForm.hasShipping ? Number(editForm.shippingCharge || 0) : 0,
        totalAmount: Number(editForm.totalAmount) || 0,
        packingImages: editForm.packingImages || [],
        productImages: editForm.productImages || [],
      };

      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? { ...o, ...data.order } : o)));
        if (selectedOrder?.id === editingOrder.id) {
          setSelectedOrder(data.order);
        }
        setEditingOrder(null);
      } else {
        const errorDetails = data.details
          ? Object.entries(data.details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(", ")
          : "";
        setEditError(data.error ? `${data.error}${errorDetails ? ` (${errorDetails})` : ""}` : "Failed to save order");
      }
    } catch (err: any) {
      setEditError(err.message || "Network error updating order");
    } finally {
      setSavingEdit(false);
    }
  };

  // Interactive Fulfilment Status Change (from table or modal)
  const handleUpdateOrderStatus = async (ord: any, nextStatus: string, e?: React.SyntheticEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/orders/${ord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = data.order || { ...ord, orderStatus: nextStatus };
        setOrders((prev) =>
          prev.map((o) => (o.id === ord.id ? { ...o, ...updated, orderStatus: nextStatus } : o))
        );
        if (selectedOrder?.id === ord.id) {
          setSelectedOrder((prev: any) => (prev ? { ...prev, ...updated, orderStatus: nextStatus } : prev));
          setNewStatus(nextStatus);
        }
      } else {
        alert(data.error || "Failed to update order status");
      }
    } catch (err) {
      console.error("Update order status error:", err);
    }
  };

  // Upload Packing Images for a specific order (Admin Only)
  const handleUploadOrderPackingImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedOrder) return;
    setUploadingPacking(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }
      const existing = selectedOrder.packingImages || [];
      const updated = [...existing, ...uploadedUrls];
      const putRes = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packingImages: updated }),
      });
      const putData = await putRes.json();
      if (putRes.ok && putData.order) {
        setSelectedOrder(putData.order);
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? putData.order : o)));
      }
    } catch (err) {
      console.error("Packing image upload error:", err);
    } finally {
      setUploadingPacking(false);
    }
  };

  const handleRemoveOrderPackingImage = async (imgUrl: string) => {
    if (!selectedOrder) return;
    const updated = (selectedOrder.packingImages || []).filter((u: string) => u !== imgUrl);
    try {
      const putRes = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packingImages: updated }),
      });
      const putData = await putRes.json();
      if (putRes.ok && putData.order) {
        setSelectedOrder(putData.order);
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? putData.order : o)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Manual Order Images (Products & Packing separately)
  const handleUploadManualProductImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingManualProductImg(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) newUrls.push(data.url);
      }
      setOfflineForm((prev) => ({
        ...prev,
        productImages: [...(prev.productImages || []), ...newUrls],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingManualProductImg(false);
    }
  };

  const handleUploadManualPackingImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingManualPackingImg(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) newUrls.push(data.url);
      }
      setOfflineForm((prev) => ({
        ...prev,
        packingImages: [...(prev.packingImages || []), ...newUrls],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingManualPackingImg(false);
    }
  };

  const handleUploadManualReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingManualReceipt(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setOfflineForm((prev) => ({
          ...prev,
          paymentScreenshotUrl: data.url,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingManualReceipt(false);
      e.target.value = "";
    }
  };

  const handleAdminScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (!file.type.startsWith("image/") && !isHeic) {
      alert("Please upload a valid image file (JPEG, PNG, WebP, HEIC).");
      return;
    }

    setUploadingAdminScreenshot(true);
    setAdminScreenshotSuccess("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Failed to upload payment screenshot");
      }

      const uploadedUrl = json.url;

      // Persist to order
      const updateRes = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentScreenshotUrl: uploadedUrl }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to save screenshot on order");
      }

      setSelectedOrder((prev: any) => (prev ? { ...prev, paymentScreenshotUrl: uploadedUrl } : null));
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentScreenshotUrl: uploadedUrl } : o))
      );
      setAdminScreenshotSuccess("Payment screenshot updated successfully!");
      setTimeout(() => setAdminScreenshotSuccess(""), 4000);
    } catch (err: any) {
      console.error("Admin screenshot upload error:", err);
      alert(err.message || "Failed to upload payment screenshot");
    } finally {
      setUploadingAdminScreenshot(false);
      e.target.value = "";
    }
  };

  // Quick Payment Status Toggle (paid <-> unpaid)
  const handleTogglePayment = async (ord: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = ord.paymentStatus === "paid" ? "unpaid" : "paid";
    try {
      const res = await fetch(`/api/admin/orders/${ord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === ord.id ? { ...o, paymentStatus: nextStatus } : o))
        );
        if (selectedOrder?.id === ord.id) {
          setSelectedOrder((prev: any) => (prev ? { ...prev, paymentStatus: nextStatus } : prev));
          setNewPaymentStatus(nextStatus);
        }
      }
    } catch (err) {
      console.error("Toggle payment error:", err);
    }
  };

  const getSelectedOrderBaseSubtotal = () => {
    if (!selectedOrder) return 0;
    if (Number(selectedOrder.subtotal) > 0) return Number(selectedOrder.subtotal);
    const existingShip = Number(selectedOrder.shippingCharge || 0);
    const existingDisc = Number(selectedOrder.discountAmount || 0);
    return Math.max(0, Number(selectedOrder.totalAmount || 0) - existingShip + existingDisc);
  };

  const calculateEditOrderTotal = () => {
    if (!selectedOrder) return 0;
    const baseSub = getSelectedOrderBaseSubtotal();
    const disc = Number(selectedOrder.discountAmount || 0);
    const ship = editHasShipping ? Number(editShippingCharge || 0) : 0;
    return Math.max(0, baseSub - disc + ship);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    setUpdateMsg("");

    const shippingChargeNum = editHasShipping ? Math.max(0, Number(editShippingCharge || 0)) : 0;
    const finalAddressLine1 = editHasShipping && editAddressLine1.trim() ? editAddressLine1.trim() : null;
    const finalAddressLine2 = editHasShipping && editAddressLine2.trim() ? editAddressLine2.trim() : null;
    const finalCity = editHasShipping && editCity.trim() ? editCity.trim() : null;
    const finalState = editHasShipping && editState.trim() ? editState.trim() : null;
    const finalPostalCode = editHasShipping && editPostalCode.trim() ? editPostalCode.trim() : null;
    const finalCountry = editHasShipping ? "India" : null;

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber: trackingNumber.trim() || undefined,
          courierName: courierName.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
          shippingCharge: shippingChargeNum,
          shippingAddressLine1: finalAddressLine1,
          shippingAddressLine2: finalAddressLine2,
          shippingCity: finalCity,
          shippingState: finalState,
          shippingPostalCode: finalPostalCode,
          shippingCountry: finalCountry,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUpdateMsg("Order & shipping details updated successfully!");
        setSelectedOrder(data.order);
        setOrders((prev) => prev.map((o) => (o.id === data.order?.id ? data.order : o)));
        loadOrders();
      } else {
        alert(data.error || "Update failed.");
      }
    } catch {
      alert("Error updating order.");
    } finally {
      setUpdating(false);
    }
  };

  // Select customer from dropdown to autofill order
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerDropdownId(customerId);
    if (!customerId) {
      setOfflineForm((prev) => ({
        ...prev,
        customerId: "",
      }));
      return;
    }

    const cust = customersList.find((c) => c.id === customerId);
    if (cust) {
      const isGuest = cust.id.startsWith("guest_");
      const cleanEmail = cust.email && !cust.email.startsWith("offline_") ? cust.email : "";
      const hasAddress = Boolean(cust.addressLine1 || cust.city || cust.state || cust.postalCode);

      setOfflineForm((prev) => ({
        ...prev,
        customerId: isGuest ? "" : cust.id,
        customerName: cust.name || prev.customerName,
        customerEmail: cleanEmail || prev.customerEmail,
        customerPhone: cust.phone || prev.customerPhone,
        hasShipping: hasAddress ? true : prev.hasShipping,
        shippingAddressLine1: cust.addressLine1 || prev.shippingAddressLine1,
        shippingAddressLine2: cust.addressLine2 || prev.shippingAddressLine2,
        shippingCity: cust.city || prev.shippingCity,
        shippingState: cust.state || prev.shippingState,
        shippingPostalCode: cust.postalCode || prev.shippingPostalCode,
      }));
    }
  };

  // Add Item to Offline Order Form
  const handleAddOfflineItem = () => {
    setOfflineForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", productName: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  // Select website product for order item row
  const handleSelectWebsiteProduct = (idx: number, productId: string) => {
    if (!productId) {
      handleOfflineItemChange(idx, "productId", "");
      return;
    }

    const prod = productsList.find((p) => p.id === productId);
    if (prod) {
      const price = prod.salePrice ? Number(prod.salePrice) : Number(prod.regularPrice) || 0;
      setOfflineForm((prev) => {
        const copy = [...prev.items];
        copy[idx] = {
          ...copy[idx],
          productId: prod.id,
          productName: prod.name,
          unitPrice: price,
        };

        // If product has images and offlineForm.productImages is empty, populate primary image
        let nextProductImages = prev.productImages;
        const prodImg = prod.images?.find((img: any) => img.isPrimary)?.imageUrl || prod.images?.[0]?.imageUrl;
        if (prodImg && (!nextProductImages || nextProductImages.length === 0)) {
          nextProductImages = [prodImg];
        }

        return { ...prev, items: copy, productImages: nextProductImages };
      });
    }
  };

  const handleRemoveOfflineItem = (idx: number) => {
    setOfflineForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleOfflineItemChange = (idx: number, field: string, val: any) => {
    setOfflineForm((prev) => {
      const copy = [...prev.items];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, items: copy };
    });
  };

  const calculateOfflineSubtotal = () => {
    return offlineForm.items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0);
  };

  const calculateOfflineTotal = () => {
    const sub = calculateOfflineSubtotal();
    const ship = offlineForm.hasShipping ? Number(offlineForm.shippingCharge || 0) : 0;
    const disc = Number(offlineForm.discountAmount || 0);
    return Math.max(0, sub - disc + ship);
  };

  const handleCreateOfflineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreatingOrder(true);

    try {
      const subtotal = calculateOfflineSubtotal();
      const shippingCharge = offlineForm.hasShipping ? Number(offlineForm.shippingCharge || 0) : 0;
      const totalAmount = Math.max(0, subtotal - Number(offlineForm.discountAmount || 0) + shippingCharge);

      const payload = {
        ...offlineForm,
        customerId: offlineForm.customerId || null,
        shippingCharge,
        shippingAddressLine1: offlineForm.hasShipping && offlineForm.shippingAddressLine1.trim()
          ? offlineForm.shippingAddressLine1.trim()
          : null,
        shippingAddressLine2: offlineForm.hasShipping && offlineForm.shippingAddressLine2?.trim()
          ? offlineForm.shippingAddressLine2.trim()
          : null,
        shippingCity: offlineForm.hasShipping && offlineForm.shippingCity.trim()
          ? offlineForm.shippingCity.trim()
          : null,
        shippingState: offlineForm.hasShipping && offlineForm.shippingState.trim()
          ? offlineForm.shippingState.trim()
          : null,
        shippingPostalCode: offlineForm.hasShipping && offlineForm.shippingPostalCode.trim()
          ? offlineForm.shippingPostalCode.trim()
          : null,
        subtotal,
        discountAmount: Number(offlineForm.discountAmount) || 0,
        discountReason: offlineForm.discountReason?.trim() || null,
        totalAmount,
        items: offlineForm.items.map((i) => ({
          productId: i.productId || null,
          productName: i.productName.trim() || "Handmade Resin Artwork",
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.quantity) * Number(i.unitPrice),
        })),
      };

      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create offline order.");
        setCreatingOrder(false);
        return;
      }

      // If converted from a Custom Studio inquiry, automatically mark the inquiry as "converted"
      if (convertingCustomRequestId) {
        try {
          const reqId = convertingCustomRequestId;
          const orderNum = data.order?.orderNumber || "";
          await fetch(`/api/admin/custom-requests/${reqId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "converted",
              adminNotes: `Converted to Order ${orderNum}`.trim(),
            }),
          });
          setCustomRequests((prev) =>
            prev.map((c) =>
              c.id === reqId
                ? {
                  ...c,
                  status: "converted",
                  adminNotes: `Converted to Order ${orderNum}`.trim(),
                }
                : c
            )
          );
          if (selectedCustomRequest?.id === reqId) {
            setSelectedCustomRequest((prev: any) =>
              prev ? { ...prev, status: "converted", adminNotes: `Converted to Order ${orderNum}`.trim() } : prev
            );
          }
        } catch (statusErr) {
          console.error("Failed to mark custom request as converted:", statusErr);
        } finally {
          setConvertingCustomRequestId(null);
        }
      }

      setShowCreateModal(false);
      setSelectedCustomerDropdownId("");
      setOfflineForm({
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        hasShipping: false,
        shippingCharge: 0,
        shippingAddressLine1: "",
        shippingAddressLine2: "",
        shippingCity: "",
        shippingState: "",
        shippingPostalCode: "",
        orderSource: "offline",
        paymentMethod: "cash",
        paymentStatus: "paid",
        paymentScreenshotUrl: "",
        upiTransactionId: "",
        orderStatus: "confirmed",
        items: [
          { productId: "", productName: "", quantity: 1, unitPrice: 0 },
        ],
        productImages: [],
        packingImages: [],
        discountAmount: 0,
        discountReason: "",
        orderNotes: "",
        internalNotes: "",
      });
      loadOrders();
    } catch {
      setCreateError("Unexpected error occurred while creating order.");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Order Management & Fulfilment
          </h1>
          <p className="text-xs text-[#736C66]">
            Track online store sales and offline exhibition / Instagram custom orders in one unified system.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-2 hover:bg-[#3D473E] shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Offline / Exhibition Order</span>
          </button>

          <a
            href="/api/admin/orders/export"
            download
            className="px-4 py-2.5 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center space-x-2 hover:bg-[#FAF8F5] shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Tab Switcher: Orders vs Custom Studio Inquiries */}
      <div className="flex items-center gap-2 border-b border-[#E8E0D5] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${activeTab === "orders"
            ? "bg-[#3A1823] text-white shadow-xs"
            : "bg-white text-[#736C66] hover:bg-[#FAF8F5] border border-[#E8E0D5]"
            }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders Management ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("custom_requests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer relative ${activeTab === "custom_requests"
            ? "bg-[#3A1823] text-white shadow-xs"
            : "bg-white text-[#736C66] hover:bg-[#FAF8F5] border border-[#E8E0D5]"
            }`}
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>Custom Studio Inquiries ({customRequests.length})</span>
          {customRequests.filter((r) => r.status === "new").length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#3A1823]">
              {customRequests.filter((r) => r.status === "new").length} New
            </span>
          )}
        </button>
      </div>

      {activeTab === "orders" ? (
        <>
          {/* Action Message Banner */}
          {actionMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
              <span>{actionMessage}</span>
              <button
                type="button"
                onClick={() => setActionMessage("")}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters Bar & Bulk Action Controls */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by order #, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
              >
                <option value="all">All Sources (Online, WhatsApp & Offline)</option>
                <option value="whatsapp">WhatsApp Orders</option>
                <option value="online">Online Web Store</option>
                <option value="offline">Offline / Exhibition / Instagram</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
              >
                <option value="all">All Fulfilment Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing (Curing)</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Bulk Removal Controls */}
            {selectedOrderIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#736C66] font-medium">
                  {selectedOrderIds.length} selected:
                </span>
                <button
                  type="button"
                  onClick={handleBulkDeleteOrders}
                  disabled={isBulkDeleting}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#FDF2F2] text-[#DF4C4C] hover:bg-[#FBE5E5] rounded-xl border border-[#FADBD8] flex items-center space-x-1.5 transition shadow-xs"
                  title="Permanently remove selected orders"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBulkDeleting ? "Removing..." : `Delete (${selectedOrderIds.length})`}</span>
                </button>
              </div>
            )}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
                  <tr>
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          filteredOrders.length > 0 &&
                          selectedOrderIds.length === filteredOrders.length
                        }
                        onChange={toggleSelectAllOrders}
                        className="rounded text-[#2C332D] cursor-pointer"
                        title="Select All Orders"
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold">Order #</th>
                    <th className="py-3 px-4 font-semibold">Source</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Products Ordered</th>
                    <th className="py-3 px-4 font-semibold">Total</th>
                    <th className="py-3 px-4 font-semibold">Fulfilment Status</th>
                    <th className="py-3 px-4 font-semibold">Payment Status (Click to Toggle)</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#736C66]">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#736C66]">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(o.id)}
                            onChange={() => toggleSelectOrder(o.id)}
                            className="rounded text-[#2C332D] cursor-pointer"
                            title={`Select Order #${o.orderNumber}`}
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#2C332D]">
                          <div>{o.orderNumber}</div>
                          <span className="text-[10px] font-normal text-[#8C7A72]">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            o.orderSource === "whatsapp"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : o.orderSource && o.orderSource !== "online"
                              ? "bg-[#FAF4EC] text-[#B8972E] border border-[#E8E0D5]"
                              : "bg-[#F0F4F8] text-[#334E68]"
                          }`}>
                            {o.orderSource || "online"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold">{o.customerName}</p>
                          {o.customerPhone && (
                            <p className="text-[10px] text-[#736C66]">{o.customerPhone}</p>
                          )}
                          {o.customerEmail && !o.customerEmail.startsWith("offline_") && (
                            <p className="text-[10px] text-[#736C66]">{o.customerEmail}</p>
                          )}
                          {!o.customerPhone && (!o.customerEmail || o.customerEmail.startsWith("offline_")) && (
                            <p className="text-[10px] text-[#8C7A72] italic">No contact info</p>
                          )}
                        </td>

                        {/* Products Ordered with Image */}
                        <td className="py-3 px-4 min-w-[210px] max-w-[280px]">
                          {o.items && o.items.length > 0 ? (
                            <div className="space-y-2">
                              {o.items.map((it: any, idx: number) => {
                                const itemImg = it.productImage || it.referenceImageUrl || o.productImages?.[0] || null;
                                return (
                                  <div key={idx} className="flex items-center gap-2.5 group">
                                    <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#E8E0D5] bg-[#FAF4EC] shrink-0 shadow-2xs">
                                      {itemImg ? (
                                        <img
                                          src={itemImg}
                                          alt={it.productName}
                                          className="w-full h-full object-cover group-hover:scale-110 transition cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(itemImg, "_blank");
                                          }}
                                          title="Click to view photo full-screen"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#B8972E]">
                                          <Package className="w-5 h-5" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 leading-snug">
                                      <p
                                        className="font-bold text-xs text-[#2C332D] truncate group-hover:text-[#800020] transition-colors"
                                        title={it.productName}
                                      >
                                        {it.productName}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#736C66] mt-0.5">
                                        <span className="font-semibold text-[#800020] bg-[#FAF0F3] px-1.5 py-0.5 rounded">
                                          Qty: {it.quantity}
                                        </span>
                                        {it.variantName && (
                                          <span className="truncate text-[#736C66] max-w-[200px]" title={it.variantName}>
                                            • {it.variantName}
                                          </span>
                                        )}
                                        {it.personalizationDetails?.color && (
                                          <span className="text-[#800020] font-medium bg-[#FFF0F4] border border-[#FADBD8] px-1.5 py-0.5 rounded text-[9px]">
                                            {it.personalizationDetails.color}
                                          </span>
                                        )}
                                        {it.referenceImageUrl && (
                                          <a
                                            href={it.referenceImageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-[#2E7D32] font-semibold underline text-[9px] hover:text-[#1e5822]"
                                          >
                                            📷 Reference Photo
                                          </a>
                                        )}
                                      </div>
                                      {it.personalizationDetails?.customName && (
                                        <span className="text-[10px] text-[#B8972E] font-medium block truncate mt-0.5">
                                          Custom: &ldquo;{it.personalizationDetails.customName}&rdquo;
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : o.productImages && o.productImages.length > 0 ? (
                            <div className="flex items-center gap-2.5 group">
                              <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#E8E0D5] bg-[#FAF4EC] shrink-0 shadow-2xs">
                                <img
                                  src={o.productImages[0]}
                                  alt="Piece photo"
                                  className="w-full h-full object-cover group-hover:scale-110 transition cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(o.productImages[0], "_blank");
                                  }}
                                  title="Click to view piece photo"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-xs text-[#2C332D]">Custom Finished Piece</p>
                                <span className="text-[10px] text-[#8C7A72] block">
                                  {o.productImages.length} photo(s) attached
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#8C7A72] italic text-[11px]">Bespoke Order</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-bold">₹{o.totalAmount}</td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          {/* Interactive Fulfilment Status Selector for Admin */}
                          <select
                            value={o.orderStatus === "shipped" ? "dispatched" : o.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(o, e.target.value, e)}
                            title="Click to change Fulfilment Status"
                            className={`capitalize px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer focus:outline-none shadow-xs ${o.orderStatus === "delivered"
                              ? "bg-[#E8EFE8] text-[#2E7D32] border-[#C5D8C5]"
                              : o.orderStatus === "dispatched" || o.orderStatus === "shipped"
                                ? "bg-[#EBF3FA] text-[#1E5B94] border-[#BDD7EE]"
                                : o.orderStatus === "processing"
                                  ? "bg-[#FFF8E6] text-[#B8860B] border-[#FDE047]"
                                  : o.orderStatus === "waiting"
                                    ? "bg-[#FFF8E1] text-[#D97706] border-[#FDE68A]"
                                    : o.orderStatus === "cancelled"
                                      ? "bg-[#FDF2F2] text-[#DF4C4C] border-[#FADBD8]"
                                      : "bg-[#FAF4EC] text-[#B8972E] border-[#E8E0D5]"
                              }`}
                          >
                            <option value="waiting">Waiting</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {/* Interactive Toggle for Admin */}
                          <button
                            type="button"
                            onClick={(e) => handleTogglePayment(o, e)}
                            title="Click to toggle Paid / Unpaid"
                            className={`capitalize px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1 ${o.paymentStatus === "paid"
                              ? "bg-[#E8EFE8] text-[#2E7D32] border-[#C5D8C5] hover:bg-[#D5E5D5]"
                              : "bg-[#FDF2F2] text-[#DF4C4C] border-[#FADBD8] hover:bg-[#FBE5E5]"
                              }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{o.paymentStatus} (Toggle)</span>
                          </button>
                          {o.paymentScreenshotUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingScreenshotModal(o.paymentScreenshotUrl);
                              }}
                              title="View Payment Screenshot Proof"
                              className="mt-1 inline-flex items-center gap-1 text-[9.5px] font-bold text-[#2E7D32] bg-[#E8EFE8] px-2 py-0.5 rounded-full border border-[#C5D8C5] hover:bg-[#D5E5D5] cursor-pointer"
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <span>Receipt Attached</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {o.paymentStatus === "paid" && (
                              <a
                                href={`/admin/orders/${o.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Generate Payment Receipt (PDF)"
                                className="p-1.5 bg-[#FAF0F3] hover:bg-[#F3E0E6] text-[#800020] border border-[#800020]/20 rounded-lg transition shadow-xs flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">PDF</span>
                              </a>
                            )}
                            <button
                              onClick={() => openOrderModal(o)}
                              className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-lg hover:bg-[#FAF8F5] shadow-xs flex items-center gap-1"
                              title="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#736C66]" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => openEditModal(o)}
                              className="px-2.5 py-1 bg-[#FAF4EC] border border-[#D4AF37]/40 text-[#800020] text-xs font-semibold rounded-lg hover:bg-[#F4EBE6] shadow-xs flex items-center gap-1"
                              title="Edit All Order Details"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#B8972E]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingleOrder(o);
                              }}
                              disabled={deletingOrderId === o.id}
                              className="p-1.5 bg-[#FDF2F2] hover:bg-[#FBE5E5] text-[#DF4C4C] border border-[#FADBD8] rounded-lg transition shadow-xs flex items-center gap-1"
                              title={`Delete Order #${o.orderNumber}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Custom Studio Inquiries View */
        <div className="space-y-4">
          {/* Custom Studio Filter Strip */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search customer, vision, phone..."
                  value={customSearch}
                  onChange={(e) => setCustomSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2C332D]"
                />
              </div>

              <select
                value={customStatusFilter}
                onChange={(e) => setCustomStatusFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
              >
                <option value="all">All Inquiry Statuses ({customRequests.length})</option>
                <option value="new">New ({customRequests.filter((r) => r.status === "new").length})</option>
                <option value="in_review">In Review</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="converted">
                  Converted to Order ({customRequests.filter((r) => r.status === "converted" || r.status === "converted_to_order").length})
                </option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadCustomRequests}
              disabled={loadingCustom}
              className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EFEAE2] border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B8972E] ${loadingCustom ? "animate-spin" : ""}`} />
              <span>Refresh Inquiries</span>
            </button>
          </div>

          {/* Custom Studio Inquiries Cards */}
          {loadingCustom ? (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center text-xs text-[#736C66]">
              Loading custom studio requests...
            </div>
          ) : customRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF4EC] text-[#B8972E] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#2C332D]">No Custom Studio Inquiries Yet</h3>
              <p className="text-xs text-[#736C66] max-w-sm mx-auto">
                When a customer submits the Custom Studio form at /custom-orders, their inquiry and uploaded reference photos will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customRequests
                .filter((r) => {
                  if (customStatusFilter !== "all") {
                    if (customStatusFilter === "converted") {
                      if (r.status !== "converted" && r.status !== "converted_to_order") return false;
                    } else if (r.status !== customStatusFilter) {
                      return false;
                    }
                  }
                  if (customSearch.trim()) {
                    const q = customSearch.toLowerCase().trim();
                    return (
                      r.customerName?.toLowerCase().includes(q) ||
                      r.customerEmail?.toLowerCase().includes(q) ||
                      r.customerPhone?.includes(q) ||
                      r.productType?.toLowerCase().includes(q) ||
                      r.description?.toLowerCase().includes(q)
                    );
                  }
                  return true;
                })
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-[#E8E0D5] p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Strip: Status & Date */}
                      <div className="flex items-center justify-between text-xs border-b border-[#F4EBE6] pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === "new"
                              ? "bg-[#FAF0F3] text-[#800020] border border-[#800020]/30"
                              : req.status === "accepted" || req.status === "converted" || req.status === "converted_to_order"
                                ? "bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5]"
                                : req.status === "quoted"
                                  ? "bg-[#EBF3FA] text-[#1E5B94] border border-[#BDD7EE]"
                                  : req.status === "in_review"
                                    ? "bg-[#FFF8E6] text-[#B8860B] border border-[#FDE047]"
                                    : "bg-[#FAF8F5] text-[#736C66] border border-[#E8E0D5]"
                              }`}
                          >
                            {req.status === "converted" || req.status === "converted_to_order"
                              ? "✓ Converted to Order"
                              : req.status?.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-[#8C7A72]">
                            {new Date(req.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Status Dropdown */}
                        <select
                          value={req.status || "new"}
                          onChange={(e) => handleUpdateCustomStatus(req.id, e.target.value)}
                          disabled={updatingCustomId === req.id}
                          className="text-[11px] font-semibold bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg px-2 py-1 text-[#2C332D] cursor-pointer"
                        >
                          <option value="new">Mark New</option>
                          <option value="in_review">In Review</option>
                          <option value="quoted">Quoted</option>
                          <option value="accepted">Accepted</option>
                          <option value="converted">Converted to Order</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      {/* Customer & Product Row */}
                      <div className="flex items-start gap-4">
                        {/* Reference Image Thumbnail */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#E8E0D5] bg-[#FAF4EC] shrink-0 relative group shadow-xs">
                          {req.referenceImageUrl ? (
                            <>
                              <img
                                src={req.referenceImageUrl}
                                alt="Customer Reference Photo"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <a
                                href={req.referenceImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                                title="View Full Resolution Photo"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#B8972E] p-2 text-center">
                              <Package className="w-5 h-5 mb-1 opacity-70" />
                              <span className="text-[9px] text-[#8C7A72] leading-tight">No Photo Attached</span>
                            </div>
                          )}
                        </div>

                        {/* Customer Info & Requirements */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-bold text-sm text-[#2C332D] truncate">
                            {req.customerName}
                          </h3>
                          <p className="text-xs font-semibold text-[#800020] truncate">
                            {req.productType}
                          </p>

                          {req.budget && (
                            <p className="text-[11px] text-[#B8972E] font-medium flex items-center gap-1">
                              <span>Budget:</span>
                              <strong className="text-[#2C332D]">{req.budget}</strong>
                            </p>
                          )}

                          <div className="flex flex-col text-[11px] text-[#736C66] pt-1">
                            <span className="truncate">{req.customerEmail}</span>
                            <span className="font-mono font-medium text-[#2C332D]">{req.customerPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Vision Description */}
                      <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] text-xs text-[#2C332D] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A72] block">
                          Client Vision &amp; Notes:
                        </span>
                        <p className="text-[11px] text-[#554E48] leading-relaxed line-clamp-3">
                          {req.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-[#F4EBE6] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${(req.customerPhone || "").replace(/[^0-9]/g, "").replace(/^0+/, "")}?text=${encodeURIComponent(
                            `Hi ${req.customerName}! ✨ Thank you for reaching out to Devangi Resin Studio regarding your custom inquiry for "${req.productType}". We reviewed your requirements and reference photo! Let's discuss your custom piece.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20BA5C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          <span>WhatsApp</span>
                        </a>

                        {req.customerPhone && (
                          <a
                            href={`tel:${req.customerPhone}`}
                            className="p-2 bg-white border border-[#E8E0D5] text-[#2C332D] rounded-xl hover:bg-[#FAF8F5] transition"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                          </a>
                        )}

                        {req.customerEmail && (
                          <a
                            href={`mailto:${req.customerEmail}`}
                            className="p-2 bg-white border border-[#E8E0D5] text-[#2C332D] rounded-xl hover:bg-[#FAF8F5] transition"
                            title="Email customer"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#1E5B94]" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === "converted" || req.status === "converted_to_order" ? (
                          <span className="px-3 py-1.5 bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span>Converted to Order</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConvertCustomToOrder(req)}
                            className="px-3 py-1.5 bg-[#3A1823] hover:bg-[#522332] text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1"
                          >
                            <Package className="w-3 h-3 text-[#D4AF37]" />
                            <span>Convert to Order</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomRequest(req)}
                          className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEAE2] border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-xl transition"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Create Offline Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D5] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#B8972E]">Studio & Sales</span>
                <h2 className="font-serif text-xl font-bold text-[#2C332D]">
                  Create Manual / Offline Order
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setConvertingCustomRequestId(null);
                }}
                className="p-1 text-[#736C66] hover:text-[#2C332D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateOfflineOrder} className="space-y-4 text-xs">
              {/* Select Existing Customer Dropdown */}
              <div className="bg-[#FAF4EC] p-3.5 rounded-2xl border border-[#E8E0D5] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2C332D] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#B8972E]" />
                    <span>Select Customer from Website / Orders</span>
                  </label>
                  {selectedCustomerDropdownId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerDropdownId("");
                        setOfflineForm((prev) => ({
                          ...prev,
                          customerId: "",
                          customerName: "",
                          customerPhone: "",
                          customerEmail: "",
                        }));
                      }}
                      className="text-[11px] text-[#DF4C4C] hover:underline font-semibold"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <select
                  value={selectedCustomerDropdownId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8E0D5] rounded-xl text-xs font-medium text-[#2C332D] focus:ring-1 focus:ring-[#B8972E]"
                >
                  <option value="">-- Choose Customer ({customersList.length} registered / past buyers) --</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `• ${c.phone}` : ""} {c.email ? `• ${c.email}` : ""} {c.city ? `(${c.city})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#736C66]">
                  Selecting a user will automatically fetch and fill their name, phone number, email, and saved shipping address.
                </p>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={offlineForm.customerName}
                    onChange={(e) => setOfflineForm({ ...offlineForm, customerName: e.target.value })}
                    placeholder="e.g. Ananya Rao"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={offlineForm.customerPhone}
                    onChange={(e) => setOfflineForm({ ...offlineForm, customerPhone: e.target.value })}
                    placeholder="e.g. 9820154321"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={offlineForm.customerEmail}
                    onChange={(e) => setOfflineForm({ ...offlineForm, customerEmail: e.target.value })}
                    placeholder="Leave blank if not available"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
              </div>

              {/* Order Source & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Order Source *</label>
                  <select
                    value={offlineForm.orderSource}
                    onChange={(e) => setOfflineForm({ ...offlineForm, orderSource: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  >
                    <option value="offline">Offline / Walk-in Studio</option>
                    <option value="whatsapp">WhatsApp Order / Inquiry</option>
                    <option value="exhibition">Art Exhibition / Pop-up Stall</option>
                    <option value="instagram">Instagram DM</option>
                    <option value="custom">Direct Custom Commission</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Payment Method</label>
                  <select
                    value={offlineForm.paymentMethod}
                    onChange={(e) => setOfflineForm({ ...offlineForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  >
                    <option value="cash">Cash in Hand</option>
                    <option value="upi">Direct UPI Transfer</option>
                    <option value="card">Card POS</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Payment Status</label>
                  <select
                    value={offlineForm.paymentStatus}
                    onChange={(e) => setOfflineForm({ ...offlineForm, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>

                <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">
                      Payment Screenshot / Receipt (Optional)
                    </label>
                    {offlineForm.paymentScreenshotUrl ? (
                      <div className="flex items-center space-x-2 bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E0D5]">
                        <img
                          src={offlineForm.paymentScreenshotUrl}
                          alt="Receipt Preview"
                          className="w-10 h-10 object-cover rounded-lg border border-[#E8E0D5]"
                        />
                        <span className="text-[11px] text-[#2E7D32] font-semibold flex-1 truncate">
                          Receipt attached
                        </span>
                        <button
                          type="button"
                          onClick={() => setOfflineForm((prev) => ({ ...prev, paymentScreenshotUrl: "" }))}
                          className="p-1 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full px-3 py-2 bg-[#FAF8F5] hover:bg-[#FAF4EC] border border-[#E8E0D5] rounded-xl flex items-center justify-between cursor-pointer transition">
                        <span className="text-[11px] text-[#736C66]">
                          {uploadingManualReceipt ? "Uploading receipt..." : "Tap to attach receipt image"}
                        </span>
                        <Camera className="w-4 h-4 text-[#B8972E]" />
                        <input
                          type="file"
                          accept="image/*,.heic,.heif,image/heic,image/heif"
                          className="hidden"
                          disabled={uploadingManualReceipt}
                          onChange={handleUploadManualReceipt}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">
                      UPI Ref / UTR / Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 428901234567"
                      value={offlineForm.upiTransactionId}
                      onChange={(e) => setOfflineForm({ ...offlineForm, upiTransactionId: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-[#F4EBE6]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[#736C66] block">
                      Products / Commission Items
                    </span>
                    <span className="text-[10px] text-[#A69E96]">
                      Select from website products or type custom handcrafted items below
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOfflineItem}
                    className="text-[#B8972E] font-bold text-[11px] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                {offlineForm.items.map((item, idx) => (
                  <div key={idx} className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E0D5] space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={item.productId || ""}
                        onChange={(e) => handleSelectWebsiteProduct(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs font-medium text-[#2C332D] focus:ring-1 focus:ring-[#B8972E]"
                      >
                        <option value="">-- Or Select Product from Website ({productsList.length} items) --</option>
                        {productsList.map((p) => {
                          const price = p.salePrice ? Number(p.salePrice) : Number(p.regularPrice) || 0;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₹{price.toFixed(2)} {p.sku ? `[${p.sku}]` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Item name / Custom Resin Piece"
                        value={item.productName}
                        onChange={(e) => handleOfflineItemChange(idx, "productName", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white border border-[#E8E0D5] rounded-xl px-2.5 py-1">
                          <span className="text-[10px] text-[#736C66] font-semibold">Qty:</span>
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleOfflineItemChange(idx, "quantity", Number(e.target.value))}
                            className="w-12 text-xs font-bold text-[#2C332D] focus:outline-none text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-[#E8E0D5] rounded-xl px-2.5 py-1">
                          <span className="text-xs font-semibold text-[#736C66]">₹</span>
                          <input
                            type="number"
                            required
                            min={0}
                            step="any"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => handleOfflineItemChange(idx, "unitPrice", Number(e.target.value))}
                            className="w-20 text-xs font-bold text-[#2C332D] focus:outline-none"
                          />
                        </div>
                        <div className="text-right text-xs font-bold text-[#2C332D] min-w-[70px]">
                          ₹{((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)).toFixed(2)}
                        </div>
                        {offlineForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOfflineItem(idx)}
                            className="p-1.5 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-lg transition"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Product Images for Manual Order */}
              <div className="space-y-2 pt-2 border-t border-[#F4EBE6]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Product Images (Custom Resin Piece)</span>
                    </span>
                    <p className="text-[10px] text-[#736C66]">Upload multiple photos of the finished piece made</p>
                  </div>
                  <label className="px-3 py-1 bg-[#FAF4EC] hover:bg-[#F4EBE6] text-[#B8972E] border border-[#E8E0D5] text-[11px] font-semibold rounded-lg cursor-pointer flex items-center gap-1 transition">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{uploadingManualProductImg ? "Uploading..." : "Upload Photos"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.heic,.heif,image/heic,image/heif"
                      className="hidden"
                      disabled={uploadingManualProductImg}
                      onChange={handleUploadManualProductImages}
                    />
                  </label>
                </div>
                {offlineForm.productImages && offlineForm.productImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {offlineForm.productImages.map((imgUrl, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8E0D5] group">
                        <img src={imgUrl} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setOfflineForm(prev => ({ ...prev, productImages: prev.productImages.filter((_, idx) => idx !== i) }))}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-4 h-4 text-[#DF4C4C]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Packing Images for Manual Order */}
              <div className="space-y-2 pt-2 border-t border-[#F4EBE6]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Packing Images (Internal Admin Only)</span>
                    </span>
                    <p className="text-[10px] text-[#736C66]">Upload photos of the packaged box / parcel</p>
                  </div>
                  <label className="px-3 py-1 bg-[#FAF4EC] hover:bg-[#F4EBE6] text-[#B8972E] border border-[#E8E0D5] text-[11px] font-semibold rounded-lg cursor-pointer flex items-center gap-1 transition">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{uploadingManualPackingImg ? "Uploading..." : "Upload Photos"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.heic,.heif,image/heic,image/heif"
                      className="hidden"
                      disabled={uploadingManualPackingImg}
                      onChange={handleUploadManualPackingImages}
                    />
                  </label>
                </div>
                {offlineForm.packingImages && offlineForm.packingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {offlineForm.packingImages.map((imgUrl, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8E0D5] group">
                        <img src={imgUrl} alt={`Packing ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setOfflineForm(prev => ({ ...prev, packingImages: prev.packingImages.filter((_, idx) => idx !== i) }))}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-4 h-4 text-[#DF4C4C]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipping Required Section (Yes / No) */}
              <div className="space-y-3 pt-2 border-t border-[#F4EBE6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-semibold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Shipping Required? *</span>
                    </label>
                    <p className="text-[10px] text-[#736C66]">
                      Does this manual order require courier shipping or direct pickup/handover?
                    </p>
                  </div>

                  {/* Yes / No Toggle Selector */}
                  <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E0D5]">
                    <button
                      type="button"
                      onClick={() =>
                        setOfflineForm({
                          ...offlineForm,
                          hasShipping: false,
                          shippingCharge: 0,
                          shippingAddressLine1: "",
                          shippingAddressLine2: "",
                          shippingCity: "",
                          shippingState: "",
                          shippingPostalCode: "",
                        })
                      }
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!offlineForm.hasShipping
                        ? "bg-[#2C332D] text-white shadow-sm"
                        : "bg-transparent text-[#736C66] hover:text-[#2C332D] hover:bg-black/5"
                        }`}
                    >
                      No (Pickup)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOfflineForm({
                          ...offlineForm,
                          hasShipping: true,
                          shippingCharge: offlineForm.shippingCharge || 79,
                        })
                      }
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${offlineForm.hasShipping
                        ? "bg-[#800020] text-white shadow-sm"
                        : "bg-transparent text-[#736C66] hover:text-[#2C332D] hover:bg-black/5"
                        }`}
                    >
                      Yes (Shipping)
                    </button>
                  </div>
                </div>

                {/* If Yes: Ask Shipping Amount & Delivery Address */}
                {offlineForm.hasShipping && (
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="font-semibold text-xs text-[#2C332D] block mb-1">
                          Shipping Amount (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-[#736C66]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="e.g. 79.00"
                            value={offlineForm.shippingCharge}
                            onChange={(e) =>
                              setOfflineForm({
                                ...offlineForm,
                                shippingCharge: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs font-mono font-bold text-[#2C332D] focus:ring-1 focus:ring-[#D4AF37]"
                          />
                        </div>
                        <p className="text-[10px] text-[#736C66] mt-0.5">
                          Added directly to total amount and itemized on the payment receipt.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-[#736C66] block">Preset Rates:</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOfflineForm({ ...offlineForm, shippingCharge: 0 })}
                            className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[10px] font-semibold rounded-lg text-[#736C66] hover:text-[#2C332D]"
                          >
                            Free (₹0)
                          </button>
                          <button
                            type="button"
                            onClick={() => setOfflineForm({ ...offlineForm, shippingCharge: 79 })}
                            className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[10px] font-semibold rounded-lg text-[#736C66] hover:text-[#2C332D]"
                          >
                            Standard (₹79)
                          </button>
                          <button
                            type="button"
                            onClick={() => setOfflineForm({ ...offlineForm, shippingCharge: 149 })}
                            className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[10px] font-semibold rounded-lg text-[#736C66] hover:text-[#2C332D]"
                          >
                            Express (₹149)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Destination Address */}
                    <div className="space-y-2 pt-2 border-t border-[#E8E0D5]">
                      <label className="font-semibold text-xs text-[#2C332D] block">
                        Delivery Destination Address
                      </label>
                      <input
                        type="text"
                        placeholder="House / Flat No, Building, Street Address"
                        value={
                          offlineForm.shippingAddressLine1 === "Studio Pick-up / Walk-in"
                            ? ""
                            : offlineForm.shippingAddressLine1
                        }
                        onChange={(e) =>
                          setOfflineForm({ ...offlineForm, shippingAddressLine1: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={offlineForm.shippingCity}
                          onChange={(e) => setOfflineForm({ ...offlineForm, shippingCity: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={offlineForm.shippingState}
                          onChange={(e) => setOfflineForm({ ...offlineForm, shippingState: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={offlineForm.shippingPostalCode}
                          onChange={(e) =>
                            setOfflineForm({ ...offlineForm, shippingPostalCode: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E0D5] space-y-2 text-xs">
                <div className="flex justify-between text-[#736C66]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono">₹{calculateOfflineSubtotal().toFixed(2)}</span>
                </div>
                <div className="space-y-1.5 pt-1 border-t border-[#E8E0D5]/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#736C66]">Discount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={offlineForm.discountAmount || ""}
                      placeholder="0.00"
                      onChange={(e) =>
                        setOfflineForm({ ...offlineForm, discountAmount: Number(e.target.value) || 0 })
                      }
                      className="w-28 px-2 py-1 bg-white border border-[#E8E0D5] rounded-lg text-xs font-mono text-right focus:border-[#2C332D] focus:outline-none"
                    />
                  </div>
                  {(Number(offlineForm.discountAmount) > 0 || offlineForm.discountReason) && (
                    <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
                      <span className="text-[#736C66] whitespace-nowrap">Discount Reason / Label:</span>
                      <input
                        type="text"
                        placeholder="e.g. Exhibition Special, Walk-in Offer, VIP Client"
                        value={offlineForm.discountReason || ""}
                        onChange={(e) => setOfflineForm({ ...offlineForm, discountReason: e.target.value })}
                        className="flex-1 px-2.5 py-1 bg-white border border-[#E8E0D5] rounded-lg text-xs text-[#2C332D] placeholder-[#A89F91] focus:border-[#2C332D] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-[#736C66] pt-1 border-t border-[#E8E0D5]/60">
                  <span>Shipping Fee:</span>
                  <span className="font-mono font-semibold">
                    {offlineForm.hasShipping
                      ? `+₹${Number(offlineForm.shippingCharge || 0).toFixed(2)}`
                      : "₹0.00 (Self-Pickup / Handover)"}
                  </span>
                </div>
                <div className="border-t border-[#E8E0D5] pt-1.5 flex justify-between items-center text-sm font-bold text-[#2C332D]">
                  <span>Calculated Grand Total:</span>
                  <span className="text-[#800020] text-base font-mono">
                    ₹{calculateOfflineTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setConvertingCustomRequestId(null);
                  }}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  {creatingOrder ? "Recording Order..." : "Save Offline Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail & Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D5] shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-[#8C7A72]">
                  Order Details ({selectedOrder.orderSource || "online"})
                </span>
                <h2 className="font-serif text-xl font-bold text-[#2C332D]">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                {selectedOrder.paymentStatus === "paid" && (
                  <a
                    href={`/admin/orders/${selectedOrder.id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#FAF0F3] hover:bg-[#F3E0E6] text-[#800020] border border-[#800020]/30 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                    title="Generate printable PDF payment receipt"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#800020]" />
                    <span>Receipt (PDF)</span>
                    <ExternalLink className="w-3 h-3 text-[#B8972E]" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    openEditModal(ord);
                  }}
                  className="px-3 py-1.5 bg-[#FAF4EC] hover:bg-[#F4EBE6] text-[#800020] border border-[#D4AF37]/40 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                  title="Edit all order details"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Edit Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSingleOrder(selectedOrder)}
                  disabled={deletingOrderId === selectedOrder.id}
                  className="px-3 py-1.5 bg-[#FDF2F2] hover:bg-[#FBE5E5] text-[#DF4C4C] border border-[#FADBD8] text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                  title="Permanently remove this order"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingOrderId === selectedOrder.id ? "Deleting..." : "Delete Order"}</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-[#736C66] hover:text-[#2C332D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {updateMsg && (
              <p className="text-xs text-[#2E7D32] bg-[#E8EFE8] p-3 rounded-xl border border-[#C5D8C5]">
                {updateMsg}
              </p>
            )}

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E0D5]">
              <div>
                <p className="font-bold text-[#2C332D]">{selectedOrder.customerName}</p>
                {selectedOrder.customerPhone && (
                  <p className="text-[#736C66]">{selectedOrder.customerPhone}</p>
                )}
                {selectedOrder.customerEmail && !selectedOrder.customerEmail.startsWith("offline_") && (
                  <p className="text-[#736C66]">{selectedOrder.customerEmail}</p>
                )}
              </div>
              <div>
                {selectedOrder.shippingAddressLine1 &&
                !selectedOrder.shippingAddressLine1.toLowerCase().includes("pick-up") &&
                !selectedOrder.shippingAddressLine1.toLowerCase().includes("pickup") &&
                !selectedOrder.shippingAddressLine1.toLowerCase().includes("walk-in") &&
                !selectedOrder.shippingAddressLine1.toLowerCase().includes("offline") ? (
                  <>
                    <p className="text-[#736C66] leading-relaxed">
                      {selectedOrder.shippingAddressLine1}
                      {selectedOrder.shippingAddressLine2 ? `, ${selectedOrder.shippingAddressLine2}` : ""}
                      <br />
                      {[selectedOrder.shippingCity, selectedOrder.shippingState].filter(Boolean).join(", ")}
                      {selectedOrder.shippingPostalCode ? ` - ${selectedOrder.shippingPostalCode}` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#8C7A72]">
                      <Truck className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>
                        Shipping Charge: <strong className="text-[#2C332D]">₹{Number(selectedOrder.shippingCharge || 0).toFixed(2)}</strong>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8972E] block">Fulfilment Mode</span>
                    <p className="font-semibold text-[#2C332D]">Studio Pick-up / Direct Handover</p>
                    <p className="text-[#736C66]">Self-collected (No courier delivery)</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#2E7D32]">
                      <Package className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>₹0.00 (Self Pick-up)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Snapshot with Customizations */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C332D]">
                Purchased Items ({selectedOrder.items?.length || 0})
              </h3>
              <div className="divide-y divide-[#F4EBE6] border border-[#E8E0D5] rounded-xl overflow-hidden bg-white">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="p-3 text-xs flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#FAF4EC] border border-[#E8E0D5] overflow-hidden shrink-0 flex items-center justify-center">
                        {item.productImage || item.referenceImageUrl ? (
                          <img
                            src={item.productImage || item.referenceImageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-[#B8972E]" />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-semibold text-[#2C332D] text-xs">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-[#736C66] text-[11px] leading-relaxed">
                            <strong className="text-[#2C332D]">Options:</strong> {item.variantName}
                          </p>
                        )}
                        {item.personalizationDetails?.color && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-[#2C332D]">Palette:</span>
                            <span className="bg-[#FAF4EC] border border-[#D4AF37]/50 text-[#800020] font-bold px-2 py-0.5 rounded-md text-[10px]">
                              {item.personalizationDetails.color}
                            </span>
                          </div>
                        )}
                        {item.personalizationDetails?.customName && (
                          <p className="text-[#B8972E] font-medium text-xs">
                            Custom Name: &ldquo;{item.personalizationDetails.customName}&rdquo;
                          </p>
                        )}
                        {item.personalizationDetails?.initials && (
                          <p className="text-[#2C332D] font-medium text-xs">
                            Monogram Initials: {item.personalizationDetails.initials}
                          </p>
                        )}
                        {item.personalizationDetails?.notes && (
                          <p className="text-[#736C66] italic text-[11px]">
                            Notes: {item.personalizationDetails.notes}
                          </p>
                        )}
                        {item.referenceImageUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={item.referenceImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-11 h-11 rounded-lg border border-[#D4AF37] overflow-hidden shrink-0 block hover:opacity-90 transition shadow-2xs"
                              title="Click to view reference image"
                            >
                              <img
                                src={item.referenceImageUrl}
                                alt="Customer Reference"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div>
                              <a
                                href={item.referenceImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#2E7D32] hover:underline"
                              >
                                <span>Customer Reference Photo</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <span className="text-[10px] text-[#8C7A72] block">Verified Blob Storage</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#2C332D]">₹{item.totalPrice}</p>
                      <p className="text-[11px] text-[#8C7A72]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Showcase / Product Photos uploaded for custom or manual piece */}
              {selectedOrder.productImages && selectedOrder.productImages.length > 0 && (
                <div className="space-y-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#B8972E]" />
                    <span>Finished Piece Photos</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.productImages.map((imgUrl: string, idx: number) => (
                      <a
                        key={idx}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-16 h-16 rounded-lg overflow-hidden border border-[#E8E0D5] hover:opacity-90 transition block"
                      >
                        <img src={imgUrl} alt={`Piece photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Packing Images (Internal Admin Only - Never Displayed to Customer) */}
              <div className="space-y-2 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E0D5]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#B8972E]" />
                      <span>Order Packing Images (Internal Admin Only)</span>
                    </h4>
                    <p className="text-[10px] text-[#736C66]">
                      Upload photos of the boutique packed parcel for internal dispatch verification. Never displayed to user.
                    </p>
                  </div>
                  <label className="px-3 py-1.5 bg-[#3A1823] hover:bg-[#522332] text-white text-[11px] font-semibold rounded-lg cursor-pointer flex items-center gap-1 transition shadow-xs">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{uploadingPacking ? "Uploading..." : "Upload Packing Photos"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.heic,.heif,image/heic,image/heif"
                      className="hidden"
                      disabled={uploadingPacking}
                      onChange={handleUploadOrderPackingImages}
                    />
                  </label>
                </div>
                {selectedOrder.packingImages && selectedOrder.packingImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {selectedOrder.packingImages.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E8E0D5] group shadow-xs">
                        <img src={imgUrl} alt={`Packing photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <a
                          href={imgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderPackingImage(imgUrl)}
                          title="Remove packing image"
                          className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-[#DF4C4C] hover:bg-white transition opacity-0 group-hover:opacity-100 shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8C7A72] italic pt-1">
                    No packing photos uploaded yet. Tap button above to attach parcel verification photos.
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Verification Details Box */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E0D5] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#B8972E]" />
                  <span>Payment &amp; Screenshot Verification</span>
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${selectedOrder.paymentStatus === "paid"
                  ? "bg-[#E8EFE8] text-[#2E7D32]"
                  : "bg-[#FDF2F2] text-[#DF4C4C]"
                  }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">
                    Customer 12-Digit UTR / Reference ID:
                  </span>
                  <span className="font-mono text-sm font-bold text-[#2C332D] block bg-white px-3 py-1.5 rounded-lg border border-[#E8E0D5]">
                    {selectedOrder.upiTransactionId || "Not Provided"}
                  </span>
                  <span className="text-[11px] text-[#736C66] block pt-1">
                    Method: <strong className="uppercase">{selectedOrder.paymentMethod || "UPI"}</strong> • Total Amount: <strong className="text-[#B8972E]">₹{selectedOrder.totalAmount}</strong>
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">
                      Payment Receipt Screenshot:
                    </span>
                    <label className="text-[11px] font-bold text-[#800020] hover:text-[#B84A67] cursor-pointer inline-flex items-center gap-1 transition-colors">
                      <Camera className="w-3 h-3 text-[#B8972E]" />
                      <span>{uploadingAdminScreenshot ? "Uploading..." : selectedOrder.paymentScreenshotUrl ? "Replace Screenshot" : "Upload Screenshot"}</span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif,image/heic,image/heif"
                        className="hidden"
                        disabled={uploadingAdminScreenshot}
                        onChange={(e) => handleAdminScreenshotUpload(e, selectedOrder.id)}
                      />
                    </label>
                  </div>

                  {adminScreenshotSuccess && (
                    <div className="mb-2 p-1.5 bg-[#E8EFE8] border border-[#C5D8C5] rounded-lg text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{adminScreenshotSuccess}</span>
                    </div>
                  )}

                  {selectedOrder.paymentScreenshotUrl ? (
                    <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-[#E8E0D5]">
                      <button
                        type="button"
                        onClick={() => setViewingScreenshotModal(selectedOrder.paymentScreenshotUrl)}
                        className="group relative block w-14 h-14 rounded-lg overflow-hidden border border-[#E8E0D5] shrink-0 cursor-pointer"
                        title="Click to view full image"
                      >
                        <img
                          src={selectedOrder.paymentScreenshotUrl}
                          alt="Payment Receipt"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => setViewingScreenshotModal(selectedOrder.paymentScreenshotUrl)}
                          className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipt Screenshot</span>
                        </button>
                        <p className="text-[10px] text-[#8C7A72] mt-0.5">
                          Tap thumbnail to inspect payment proof in full resolution
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] flex items-center justify-between text-xs">
                      <span className="text-[#8C7A72] italic">
                        No screenshot attached yet.
                      </span>
                      <label className="text-xs font-bold text-[#800020] bg-[#FAF0F3] hover:bg-[#F3E0E6] px-2.5 py-1 rounded-lg border border-[#800020]/20 cursor-pointer inline-flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-[#B84A67]" />
                        <span>Upload Screenshot</span>
                        <input
                          type="file"
                          accept="image/*,.heic,.heif,image/heic,image/heif"
                          className="hidden"
                          disabled={uploadingAdminScreenshot}
                          onChange={(e) => handleAdminScreenshotUpload(e, selectedOrder.id)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.paymentStatus === "paid" ? (
                <div className="pt-2 border-t border-[#E8E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-1.5 text-xs text-[#2E7D32] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                    <span>Payment Verified &amp; Confirmed</span>
                  </div>
                  <a
                    href={`/admin/orders/${selectedOrder.id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#800020] hover:bg-[#68001a] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center space-x-2 cursor-pointer transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Payment Receipt (PDF)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#E8C568]" />
                  </a>
                </div>
              ) : (
                <div className="pt-2 border-t border-[#E8E0D5] flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleTogglePayment(selectedOrder, e)}
                    className="px-4 py-2 bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Receipt &amp; Mark as Paid</span>
                  </button>
                </div>
              )}
            </div>

            {/* Update Status Form */}
            <form onSubmit={handleUpdateOrder} className="space-y-4 pt-2 border-t border-[#F4EBE6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C332D]">
                Update Payment & Fulfilment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Payment Status (Paid / Unpaid)
                  </label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D] font-bold"
                  >
                    <option value="paid">Paid (Confirmed)</option>
                    <option value="unpaid">Unpaid (Will notify customer & discard)</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Fulfilment Status
                  </label>
                  <select
                    value={newStatus === "shipped" ? "dispatched" : newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
                  >
                    <option value="waiting">Waiting</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing (Curing / Handcrafting)</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Shipping Required Section (Yes / No, Amount & Address) */}
              <div className="space-y-3 pt-3 border-t border-[#F4EBE6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-semibold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Shipping Required? *</span>
                    </label>
                    <p className="text-[10px] text-[#736C66]">
                      Does this order require courier delivery or customer studio pickup?
                    </p>
                  </div>

                  {/* Yes / No Toggle Selector */}
                  <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E0D5]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditHasShipping(false);
                        setEditShippingCharge(0);
                        setEditAddressLine1("");
                        setEditAddressLine2("");
                        setEditCity("");
                        setEditState("");
                        setEditPostalCode("");
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!editHasShipping
                        ? "bg-[#2C332D] text-white shadow-sm"
                        : "bg-transparent text-[#736C66] hover:text-[#2C332D] hover:bg-black/5"
                        }`}
                    >
                      No (Pickup)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditHasShipping(true);
                        if (!editShippingCharge) setEditShippingCharge(79);
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${editHasShipping
                        ? "bg-[#800020] text-white shadow-sm"
                        : "bg-transparent text-[#736C66] hover:text-[#2C332D] hover:bg-black/5"
                        }`}
                    >
                      Yes (Shipping)
                    </button>
                  </div>
                </div>

                {/* If Yes: Ask Shipping Amount & Delivery Address */}
                {editHasShipping ? (
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="font-semibold text-xs text-[#2C332D] block mb-1">
                          Shipping Amount (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-[#736C66]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="e.g. 79.00"
                            value={editShippingCharge}
                            onChange={(e) =>
                              setEditShippingCharge(Math.max(0, Number(e.target.value) || 0))
                            }
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs font-mono font-bold text-[#2C332D] focus:ring-1 focus:ring-[#D4AF37]"
                          />
                        </div>
                        <p className="text-[10px] text-[#736C66] mt-0.5">
                          Updates the order total and prints on the payment receipt.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-[#736C66] block">Preset Rates:</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditShippingCharge(0)}
                            className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[10px] font-semibold rounded-lg text-[#736C66] hover:text-[#2C332D]"
                          >
                            Free (₹0)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditShippingCharge(79)}
                            className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[10px] font-semibold rounded-lg text-[#736C66] hover:text-[#2C332D]"
                          >
                            Standard (₹79)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditShippingCharge(149)}
                            className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[10px] font-semibold rounded-lg text-[#736C66] hover:text-[#2C332D]"
                          >
                            Express (₹149)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Destination Address */}
                    <div className="space-y-2 pt-2 border-t border-[#E8E0D5]">
                      <label className="font-semibold text-xs text-[#2C332D] block">
                        Delivery Destination Address
                      </label>
                      <input
                        type="text"
                        placeholder="House / Flat No, Building, Street Address"
                        value={
                          editAddressLine1.toLowerCase().includes("pick-up") || editAddressLine1.toLowerCase().includes("pickup")
                            ? ""
                            : editAddressLine1
                        }
                        onChange={(e) => setEditAddressLine1(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={editState}
                          onChange={(e) => setEditState(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={editPostalCode}
                          onChange={(e) => setEditPostalCode(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] flex items-center justify-between text-xs">
                    <span className="text-[#736C66] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Delivery Mode: <strong>Studio Pick-up / Direct Handover</strong></span>
                    </span>
                    <span className="font-mono font-bold text-[#2E7D32]">₹0.00 Shipping</span>
                  </div>
                )}

                {/* Live Order Recalculated Total Breakdown */}
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#736C66]">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-semibold">₹{getSelectedOrderBaseSubtotal().toFixed(2)}</span>
                  </div>
                  {Number(selectedOrder.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-[#2E7D32]">
                      <span>Discount Applied{selectedOrder.discountReason ? ` (${selectedOrder.discountReason})` : ""}:</span>
                      <span className="font-mono font-semibold">-₹{Number(selectedOrder.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#736C66]">
                    <span>Shipping Fee:</span>
                    <span className="font-mono font-semibold">
                      {editHasShipping
                        ? `+₹${Number(editShippingCharge || 0).toFixed(2)}`
                        : "₹0.00 (Self-Pickup)"}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-[#E8E0D5] flex justify-between items-center font-bold">
                    <span className="text-[#2C332D]">Recalculated Order Total:</span>
                    <span className="font-mono text-sm text-[#800020]">
                      ₹{calculateEditOrderTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. Delhivery / Blue Dart"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Tracking Number (AWB)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DELHIVERY-7749210"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Payment verified, ready for packaging."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  {updating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D5] shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF4EC] text-[#B8972E] border border-[#E8E0D5]">
                    {editForm.orderSource || "offline"} Order
                  </span>
                  <span className="text-xs text-[#8C7A72]">
                    Created {new Date(editingOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C332D] mt-1">
                  Edit Order #{editingOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 text-[#736C66] hover:text-[#2C332D] rounded-full hover:bg-[#FAF8F5] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditOrder} className="space-y-6 text-xs">
              {/* 1. Customer Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Customer Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={editForm.customerEmail}
                      onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                      placeholder="Leave blank if not available"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Order Source & Fulfilment Status */}
              <div className="space-y-3 pt-3 border-t border-[#F4EBE6]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Order Origin &amp; Fulfilment</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Order Source</label>
                    <select
                      value={editForm.orderSource}
                      onChange={(e) => setEditForm({ ...editForm, orderSource: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D]"
                    >
                      <option value="offline">Offline / Walk-in Studio</option>
                      <option value="whatsapp">WhatsApp Order</option>
                      <option value="exhibition">Art Exhibition / Pop-up Stall</option>
                      <option value="instagram">Instagram DM</option>
                      <option value="custom">Direct Custom Commission</option>
                      <option value="online">Online Store</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Fulfilment Status</label>
                    <select
                      value={editForm.orderStatus === "shipped" ? "dispatched" : editForm.orderStatus}
                      onChange={(e) => setEditForm({ ...editForm, orderStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] font-medium"
                    >
                      <option value="waiting">Waiting</option>
                      <option value="pending_payment">Pending Payment</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing (Handcrafting)</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={editForm.courierName}
                      onChange={(e) => setEditForm({ ...editForm, courierName: e.target.value })}
                      placeholder="e.g. Delhivery / Blue Dart"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Tracking Number (AWB)</label>
                    <input
                      type="text"
                      value={editForm.trackingNumber}
                      onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                      placeholder="e.g. DELHIVERY-7749210"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs font-mono text-[#2C332D]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Payment Method & Status */}
              <div className="space-y-3 pt-3 border-t border-[#F4EBE6]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Payment Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Payment Method</label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D]"
                    >
                      <option value="cash">Cash in Hand</option>
                      <option value="upi">Direct UPI Transfer</option>
                      <option value="card">Card POS</option>
                      <option value="bank_transfer">Bank Transfer / NEFT</option>
                      <option value="razorpay">Razorpay Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">Payment Status</label>
                    <select
                      value={editForm.paymentStatus}
                      onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] font-bold"
                    >
                      <option value="paid">Paid (Verified)</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[#2C332D] block mb-1">UPI Ref / UTR / Note</label>
                    <input
                      type="text"
                      value={editForm.upiTransactionId}
                      onChange={(e) => setEditForm({ ...editForm, upiTransactionId: e.target.value })}
                      placeholder="e.g. 423984729182"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs font-mono text-[#2C332D]"
                    />
                  </div>
                </div>

                {/* Payment Screenshot Proof */}
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#2C332D] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Payment Screenshot Proof</span>
                    </span>
                    <label className="cursor-pointer text-xs font-bold text-[#800020] hover:underline flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingEditReceipt ? "Uploading..." : editForm.paymentScreenshotUrl ? "Replace Screenshot" : "Upload Screenshot"}</span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif,image/heic,image/heif"
                        className="hidden"
                        disabled={uploadingEditReceipt}
                        onChange={handleUploadEditReceipt}
                      />
                    </label>
                  </div>
                  {editForm.paymentScreenshotUrl ? (
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#E8E0D5]">
                      <img
                        src={editForm.paymentScreenshotUrl}
                        alt="Payment Proof"
                        className="w-14 h-14 object-cover rounded-lg border border-[#E8E0D5] cursor-pointer"
                        onClick={() => setViewingScreenshotModal(editForm.paymentScreenshotUrl)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#2C332D] truncate">Payment Receipt Image</p>
                        <button
                          type="button"
                          onClick={() => setViewingScreenshotModal(editForm.paymentScreenshotUrl)}
                          className="text-[10px] text-[#800020] hover:underline"
                        >
                          View Full Size
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveEditReceipt}
                        className="p-1.5 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-lg transition"
                        title="Remove screenshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#8C7A72] italic">No payment receipt screenshot attached.</p>
                  )}
                </div>
              </div>

              {/* 4. Itemized Products Table */}
              <div className="space-y-3 pt-3 border-t border-[#F4EBE6]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#B8972E]" />
                    <span>Purchased Items &amp; Quantities ({editForm.items.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="px-2.5 py-1 bg-[#FAF4EC] hover:bg-[#F4EBE6] text-[#800020] border border-[#D4AF37]/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-[#E8E0D5] rounded-2xl p-3 bg-[#FAF8F5]">
                  {editForm.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-white rounded-xl border border-[#E8E0D5]">
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-[#8C7A72] block sm:hidden">Product Name</label>
                        <input
                          type="text"
                          required
                          value={item.productName}
                          onChange={(e) => handleEditItemChange(idx, "productName", e.target.value)}
                          placeholder="Product Name"
                          className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg text-xs text-[#2C332D] font-medium"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] font-bold text-[#8C7A72] block sm:hidden">Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleEditItemChange(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg text-xs text-[#2C332D] text-center"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] font-bold text-[#8C7A72] block sm:hidden">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleEditItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          placeholder="Price ₹"
                          className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg text-xs text-[#2C332D] text-right font-mono"
                        />
                      </div>
                      <div className="w-24 text-right font-mono font-bold text-xs text-[#2C332D] py-1">
                        ₹{(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditItem(idx)}
                        disabled={editForm.items.length <= 1}
                        className={`p-1.5 rounded-lg transition ${editForm.items.length <= 1 ? "opacity-30 cursor-not-allowed text-[#8C7A72]" : "text-[#DF4C4C] hover:bg-[#FDF2F2]"}`}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Shipping Required & Address */}
              <div className="space-y-3 pt-3 border-t border-[#F4EBE6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-semibold text-xs uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Shipping Required?</span>
                    </label>
                    <p className="text-[10px] text-[#736C66]">
                      Does this order require courier dispatch or customer studio pickup?
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E0D5]">
                    <button
                      type="button"
                      onClick={() => {
                        const tot = Math.max(0, editForm.subtotal - Number(editForm.discountAmount || 0));
                        setEditForm({
                          ...editForm,
                          hasShipping: false,
                          shippingCharge: 0,
                          shippingAddressLine1: "",
                          shippingAddressLine2: "",
                          shippingCity: "",
                          shippingState: "",
                          shippingPostalCode: "",
                          shippingCountry: "",
                          totalAmount: tot,
                        });
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!editForm.hasShipping
                        ? "bg-[#2C332D] text-white shadow-sm"
                        : "bg-transparent text-[#736C66] hover:text-[#2C332D] hover:bg-black/5"
                        }`}
                    >
                      No (Pickup)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ship = editForm.shippingCharge || 79;
                        const tot = Math.max(0, editForm.subtotal - Number(editForm.discountAmount || 0) + ship);
                        setEditForm({
                          ...editForm,
                          hasShipping: true,
                          shippingCharge: ship,
                          totalAmount: tot,
                        });
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${editForm.hasShipping
                        ? "bg-[#800020] text-white shadow-sm"
                        : "bg-transparent text-[#736C66] hover:text-[#2C332D] hover:bg-black/5"
                        }`}
                    >
                      Yes (Courier)
                    </button>
                  </div>
                </div>

                {editForm.hasShipping && (
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5] space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-semibold text-[#2C332D]">Shipping Charge (₹):</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.shippingCharge}
                        onChange={(e) => {
                          const ship = Number(e.target.value) || 0;
                          const tot = Math.max(0, editForm.subtotal - Number(editForm.discountAmount || 0) + ship);
                          setEditForm({ ...editForm, shippingCharge: ship, totalAmount: tot });
                        }}
                        className="w-24 px-2.5 py-1 bg-white border border-[#E8E0D5] rounded-lg text-xs font-mono font-bold text-right"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const tot = Math.max(0, editForm.subtotal - Number(editForm.discountAmount || 0));
                          setEditForm({ ...editForm, shippingCharge: 0, totalAmount: tot });
                        }}
                        className="px-2 py-1 bg-white border border-[#E8E0D5] rounded-lg text-[10px] font-semibold text-[#736C66] hover:text-[#2C332D]"
                      >
                        ₹0 Free
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tot = Math.max(0, editForm.subtotal - Number(editForm.discountAmount || 0) + 79);
                          setEditForm({ ...editForm, shippingCharge: 79, totalAmount: tot });
                        }}
                        className="px-2 py-1 bg-white border border-[#E8E0D5] rounded-lg text-[10px] font-semibold text-[#736C66] hover:text-[#2C332D]"
                      >
                        ₹79 Std
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tot = Math.max(0, editForm.subtotal - Number(editForm.discountAmount || 0) + 149);
                          setEditForm({ ...editForm, shippingCharge: 149, totalAmount: tot });
                        }}
                        className="px-2 py-1 bg-white border border-[#E8E0D5] rounded-lg text-[10px] font-semibold text-[#736C66] hover:text-[#2C332D]"
                      >
                        ₹149 Exp
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#2C332D] block mb-1">Address Line 1</label>
                        <input
                          type="text"
                          value={editForm.shippingAddressLine1}
                          onChange={(e) => setEditForm({ ...editForm, shippingAddressLine1: e.target.value })}
                          placeholder="Building, street, flat no."
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#2C332D] block mb-1">Address Line 2</label>
                        <input
                          type="text"
                          value={editForm.shippingAddressLine2}
                          onChange={(e) => setEditForm({ ...editForm, shippingAddressLine2: e.target.value })}
                          placeholder="Landmark, area (optional)"
                          className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                        <div>
                          <label className="text-[11px] font-semibold text-[#2C332D] block mb-1">City</label>
                          <input
                            type="text"
                            value={editForm.shippingCity}
                            onChange={(e) => setEditForm({ ...editForm, shippingCity: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-[#2C332D] block mb-1">State</label>
                          <input
                            type="text"
                            value={editForm.shippingState}
                            onChange={(e) => setEditForm({ ...editForm, shippingState: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-[#2C332D] block mb-1">Postal Code</label>
                          <input
                            type="text"
                            value={editForm.shippingPostalCode}
                            onChange={(e) => setEditForm({ ...editForm, shippingPostalCode: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Product & Packing Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#F4EBE6]">
                {/* Finished Piece Photos */}
                <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#2C332D] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Finished Piece Photos</span>
                    </span>
                    <label className="cursor-pointer text-[11px] font-bold text-[#800020] hover:underline flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingEditProductImg ? "Uploading..." : "+ Add Photos"}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.heic,.heif,image/heic,image/heif"
                        className="hidden"
                        disabled={uploadingEditProductImg}
                        onChange={handleUploadEditProductImages}
                      />
                    </label>
                  </div>
                  {editForm.productImages && editForm.productImages.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {editForm.productImages.map((imgUrl, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-[#E8E0D5] aspect-square bg-white">
                          <img src={imgUrl} alt="Piece" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditProductImg(i)}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#8C7A72] italic">No piece photos attached.</p>
                  )}
                </div>

                {/* Packing Photos */}
                <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#2C332D] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Parcel Packing Photos</span>
                    </span>
                    <label className="cursor-pointer text-[11px] font-bold text-[#800020] hover:underline flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingEditPackingImg ? "Uploading..." : "+ Add Photos"}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.heic,.heif,image/heic,image/heif"
                        className="hidden"
                        disabled={uploadingEditPackingImg}
                        onChange={handleUploadEditPackingImages}
                      />
                    </label>
                  </div>
                  {editForm.packingImages && editForm.packingImages.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {editForm.packingImages.map((imgUrl, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-[#E8E0D5] aspect-square bg-white">
                          <img src={imgUrl} alt="Packing" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditPackingImg(i)}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#8C7A72] italic">No packing photos attached.</p>
                  )}
                </div>
              </div>

              {/* 7. Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#F4EBE6]">
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Customer / Order Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.orderNotes}
                    onChange={(e) => setEditForm({ ...editForm, orderNotes: e.target.value })}
                    placeholder="Notes visible to customer or special instructions"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Internal Studio Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.internalNotes}
                    onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                    placeholder="Private notes (payment verification, packaging reminders, etc.)"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* 8. Financial Breakdown Summary */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E0D5] space-y-2">
                <div className="flex justify-between text-xs text-[#736C66]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-semibold">₹{editForm.subtotal.toFixed(2)}</span>
                </div>
                <div className="space-y-1.5 pt-1 border-t border-[#E8E0D5]/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#736C66]">Discount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editForm.discountAmount || ""}
                      placeholder="0.00"
                      onChange={(e) => {
                        const disc = Number(e.target.value) || 0;
                        const ship = editForm.hasShipping ? Number(editForm.shippingCharge || 0) : 0;
                        const tot = Math.max(0, editForm.subtotal - disc + ship);
                        setEditForm({ ...editForm, discountAmount: disc, totalAmount: tot });
                      }}
                      className="w-28 px-2 py-1 bg-white border border-[#E8E0D5] rounded-lg text-xs font-mono text-right focus:border-[#2C332D] focus:outline-none"
                    />
                  </div>
                  {(Number(editForm.discountAmount) > 0 || editForm.discountReason) && (
                    <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
                      <span className="text-[#736C66] whitespace-nowrap">Discount Reason / Label:</span>
                      <input
                        type="text"
                        placeholder="e.g. Exhibition Offer, Friends & Family, Custom Quote"
                        value={editForm.discountReason || ""}
                        onChange={(e) => setEditForm({ ...editForm, discountReason: e.target.value })}
                        className="flex-1 px-2.5 py-1 bg-white border border-[#E8E0D5] rounded-lg text-xs text-[#2C332D] placeholder-[#A89F91] focus:border-[#2C332D] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-[#736C66] pt-1 border-t border-[#E8E0D5]/60">
                  <span>Shipping Fee:</span>
                  <span className="font-mono font-semibold">
                    {editForm.hasShipping ? `+₹${Number(editForm.shippingCharge || 0).toFixed(2)}` : "₹0.00 (Self-Pickup)"}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E8E0D5] flex justify-between items-center text-sm font-bold">
                  <span className="text-[#2C332D]">Total Order Amount:</span>
                  <span className="font-mono text-base text-[#800020]">
                    ₹{editForm.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F4EBE6]">
                <button
                  type="button"
                  onClick={() => handleDeleteSingleOrder(editingOrder)}
                  disabled={deletingOrderId === editingOrder.id}
                  className="px-3.5 py-2 bg-[#FDF2F2] hover:bg-[#FBE5E5] text-[#DF4C4C] border border-[#FADBD8] text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                  title="Permanently remove this order"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingOrderId === editingOrder.id ? "Deleting..." : "Delete Order"}</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66] hover:bg-[#FAF8F5] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-2.5 bg-[#800020] hover:bg-[#68001a] text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {savingEdit ? "Saving All Changes..." : "Save Order Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Custom Request Modal */}
      {selectedCustomRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8E0D5]">
            <div className="flex items-start justify-between border-b border-[#F4EBE6] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#B8972E] tracking-wider block">
                  Bespoke Commission Inquiry
                </span>
                <h2 className="font-serif text-xl font-bold text-[#2C332D]">
                  {selectedCustomRequest.productType}
                </h2>
                <p className="text-xs text-[#736C66]">
                  Submitted by {selectedCustomRequest.customerName} on{" "}
                  {new Date(selectedCustomRequest.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomRequest(null)}
                className="p-1 text-[#736C66] hover:text-[#2C332D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reference Image Large Display */}
            {selectedCustomRequest.referenceImageUrl ? (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] block">
                  Client Uploaded Reference Photo:
                </span>
                <div className="relative rounded-2xl overflow-hidden border border-[#E8E0D5] bg-[#FAF8F5] max-h-72 flex items-center justify-center">
                  <img
                    src={selectedCustomRequest.referenceImageUrl}
                    alt="Customer Reference"
                    className="w-full max-h-72 object-contain"
                  />
                  <a
                    href={selectedCustomRequest.referenceImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-[11px] font-semibold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <span>Open High-Res Photo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] text-xs text-[#8C7A72] italic text-center">
                Customer did not upload a reference photograph for this inquiry.
              </div>
            )}

            {/* Customer Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E0D5]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">Client Name:</span>
                <p className="font-bold text-[#2C332D] text-sm">{selectedCustomRequest.customerName}</p>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block mt-2">Email:</span>
                <p className="text-[#2C332D]">{selectedCustomRequest.customerEmail}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">Phone / WhatsApp:</span>
                <p className="font-bold text-[#2C332D]">{selectedCustomRequest.customerPhone}</p>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block mt-2">Target Budget:</span>
                <p className="font-bold text-[#B8972E]">{selectedCustomRequest.budget || "Not Specified"}</p>
              </div>
            </div>

            {/* Description / Brief */}
            <div className="space-y-1 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] block">
                Artisan Brief &amp; Vision:
              </span>
              <p className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] text-[#2C332D] leading-relaxed whitespace-pre-wrap">
                {selectedCustomRequest.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F4EBE6]">
              <a
                href={`https://wa.me/${(selectedCustomRequest.customerPhone || "").replace(/[^0-9]/g, "").replace(/^0+/, "")}?text=${encodeURIComponent(
                  `Hi ${selectedCustomRequest.customerName}! ✨ Thank you for reaching out to Devangi Resin Studio regarding your custom inquiry for "${selectedCustomRequest.productType}". We reviewed your requirements and reference photo! Let's discuss your custom piece.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20BA5C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Reply on WhatsApp</span>
              </a>

              <div className="flex items-center space-x-2">
                {selectedCustomRequest.status === "converted" || selectedCustomRequest.status === "converted_to_order" ? (
                  <span className="px-3.5 py-2 bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                    <span>Converted to Order</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleConvertCustomToOrder(selectedCustomRequest);
                      setSelectedCustomRequest(null);
                    }}
                    className="px-4 py-2 bg-[#3A1823] hover:bg-[#522332] text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1"
                  >
                    <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Convert to Order</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCustomRequest(null)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Screenshot Lightbox Modal */}
      {viewingScreenshotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewingScreenshotModal(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden p-5 sm:p-6 space-y-4 border border-[#E8E0D5] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-[#B8972E]" />
                <h3 className="font-serif text-lg font-bold text-[#2C332D]">
                  Payment Receipt Proof
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={viewingScreenshotModal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#FAF0F3] text-[#3A1823] border border-[#E8E0D5] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#B84A67]" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewingScreenshotModal(null)}
                  className="p-1.5 text-[#736C66] hover:text-[#2C332D] rounded-full hover:bg-[#FAF8F5] transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-[#FAF8F5] rounded-2xl p-3 min-h-[300px]">
              <img
                src={viewingScreenshotModal}
                alt="Payment Receipt Screenshot"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-[#E8E0D5]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
