function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZSWHB1WM012_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}