sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, MessageBox, Utilities, History, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.mrpReportGr.controller.ReturnFromWO", {
		handleRouteMatched: function(oEvent) {
			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;
				var oPath;
				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}
			}

		},
		woInput: function(oEvent) {
			var url = this.getView().getModel().sServiceUrl;
			var oModel = new sap.ui.model.odata.v2.ODataModel(url, true);
			this.oTable = this.getView().byId("oTable");
			this.oHeaderModel = new sap.ui.model.json.JSONModel();
			this.oItemsModel = new sap.ui.model.json.JSONModel();
			var value = oEvent.getSource().getValue();
			var sGroup = jQuery.sap.uid();
			var sGroup2 = jQuery.sap.uid() + "2";
			oModel.setDeferredGroups([sGroup]);
			//Read Header
			oModel.read("/ReceiveWorkOrdHeaderSet('" + value + "')", {
				groupId: sGroup
			});
			//Read Items
			oModel.read("/ReceiveWorkOrdHeaderSet('" + value + "')/OrdItems", {
				groupId: sGroup
			});
			oModel.submitChanges({
				groupId: sGroup,
				success: function(oResponse) {
					var statusCode;
					if (oResponse.__batchResponses[0].response === undefined) {
						statusCode = oResponse.__batchResponses[0].statusCode;
					} else {
						statusCode = oResponse.__batchResponses[0].response.statusCode;
					}
					if (statusCode !== "404") {
						this.oDataHeader = oResponse.__batchResponses[0].data;
						this.oHeaderModel.setData(this.oDataHeader);
						this.oDataItems = oResponse.__batchResponses[1].data.results;
						for (var i = 0; i < this.oDataItems.length; i++) {
							this.oDataItems[i].ConfirmQty = this.oDataItems[i].RemainQty;
						}
						this.oItemsModel.setData(this.oDataItems);
						oModel.setDeferredGroups([sGroup2]);
						debugger;
						//Read Batch
						for (var i = 0; i < this.oDataItems.length; i++) {
							var filters = [];
							filters.push(new Filter("OrderNumber", FilterOperator.EQ, "'" + this.oDataItems[i].OrderNo + "'"));
							filters.push(new Filter("MaterialNo", FilterOperator.EQ, "'" + this.oDataItems[i].MaterialNo + "'"));
							oModel.read("/BatchSet", {
								groupId: sGroup2,
								filters: filters
							});
						}
						oModel.submitChanges({
							groupId: sGroup2,
							success: function(oBatchResponse) {
								for (var j = 0; j < this.oDataItems.length; j++) {

									this.oItemsModel.getData()[j].batchlist = oBatchResponse.__batchResponses[j].data.results;

								}
								this.getView().setModel(this.oHeaderModel, "header");
								this.getView().byId("woTable").setModel(this.oItemsModel, "items");
							}.bind(this)
						});
					} else {
						debugger;
						var headerModel = this.getView().getModel("header");
						var itemModel = this.getView().byId("woTable").getModel("items");
						if (headerModel && itemModel) {
							headerModel.setData(null);
							headerModel.updateBindings(true);
							itemModel.setData(null);
							itemModel.updateBindings(true);
						}

						sap.m.MessageToast.show("WorkOrder not found");

					}
				}.bind(this)
			});
		},
		_onPageNavButtonPress: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("LandingPage", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		_onButtonPress: function(oEvent) {

			var sDialogName = "Dialog13";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.mrpReportGr.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress1: function(oEvent) {

			var sDialogName = "Dialog12";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.mrpReportGr.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onTableDelete: function(oEvent) {

			var oSource = oEvent.getParameter("listItem");
			var oSourceBindingContext = oSource.getBindingContext();

			return new Promise(function(fnResolve, fnReject) {
				if (oSourceBindingContext) {
					var oModel = oSourceBindingContext.getModel();
					oModel.remove(oSourceBindingContext.getPath(), {
						success: function() {
							oModel.refresh();
							fnResolve();
						},
						error: function() {
							oModel.refresh();
							fnReject(new Error("remove failed"));
						}
					});
				} else {
					oSource.getParent().removeItem(oSource);
				}
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onObjectIdentifierTitlePress: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("MaterialMasterInfoPage", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onObjectIdentifierTitlePress1: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("MaterialMasterInfoPage", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress2: function() {
			return new Promise(function(fnResolve) {
				sap.m.MessageBox.confirm("Are You sure to Clear All Items?", {
					title: "Clear All",
					actions: ["Confirm", "Cancel"],
					onClose: function(sActionClicked) {
						fnResolve(sActionClicked === "Confirm");
						if (sActionClicked == "Confirm") {
							this.getView().byId("woTable").removeAllItems(true);
							// this.getView().byId("vendorHeader").setVisible(false);
							this.getView().byId("woinput").setValue("");
							this.getView().byId("toolbar").setText("Items (0)");
							// this.getView().byId("note").setValue("");
							// this.getView().byId("dialog2").getModel().setData({}).refresh();
							// this.getView().byId("poinput").setText("");

						}
					}.bind(this)
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onButtonPress3: function() {
			return new Promise(function(fnResolve) {
				var box = new sap.m.VBox({
					items: [
						new sap.m.Text({
							text: "Are you sure to confirm?"
						}),
						new sap.m.TextArea({
							value: '',
							cols: 80,
							rows: 4,
							placeholder: "Enter Note Here"
						}).addStyleClass('textarea')
					]
				});
				sap.m.MessageBox.confirm(box, {
					title: "Confirm",
					actions: ["Confirm", "Cancel"],
					onClose: function(sActionClicked) {
						fnResolve(sActionClicked === "Confirm");
						if (sActionClicked == "Confirm") {

							this.getView().getModel("po").refresh();
							this.getView().byId("woTable").removeAllItems(true);
							// this.getView().byId("vendorHeader").setVisible(false);
							this.getView().byId("woinput").setValue("");
							this.getView().byId("toolbar").setText("Items (0)");
							// this.getView().byId("note").setValue("");
							sap.m.MessageBox.success("WO Number : " + this.getView().byId("woinput").getValue() + " is confirmed.");
							// sap.m.MessageToast.show("PO Number : " + cPOno + " was confirmed.");
							// this.getView().byId("dialog2").getModel().setData({}).refresh();
							// sap.m.MessageBox.information("PO Number : " + cPOno + " was confirmed.);

							// this.getView().byId("poinput").setText("");

						}
					}.bind(this)
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onButtonPress4: function(oEvent) {

			var sDialogName = "Dialog12";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.mrpReportGr.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("ReturnFromWO").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);