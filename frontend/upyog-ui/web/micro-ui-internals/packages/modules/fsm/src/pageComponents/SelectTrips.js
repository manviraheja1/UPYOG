import React, { useEffect, useState } from "react";
import { getVehicleType } from "../utils";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, Loader, CardLabelError } from "@upyog/digit-ui-react-components";
import { useLocation, useParams } from "react-router-dom";

const SelectTrips = ({ t, config, onSelect, formData = {}, userType, styles, FSMTextFieldStyle }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const state = Digit.ULBService.getStateId();
  const { pathname: url } = useLocation();
  const editScreen = url.includes("/modify-application/");
  let { id: applicationNumber } = useParams();
  const userInfo = Digit.UserService.getUser();
  const { isLoading: applicationLoading, isError, data: applicationData, error } = Digit.Hooks.fsm.useSearch(
    tenantId,
    { applicationNos: applicationNumber, uuid: userInfo.uuid },
    { staleTime: Infinity }
  );

  const [vehicle, setVehicle] = useState({ label: formData?.tripData?.vehicleCapacity });
  const [billError, setError] = useState(false);

  const { isLoading: isVehicleMenuLoading, data: vehicleData } = Digit.Hooks.fsm.useMDMS(state, "Vehicle", "VehicleType", { staleTime: Infinity });

  const { data: dsoData, isLoading: isDsoLoading, isSuccess: isDsoSuccess, error: dsoError } = Digit.Hooks.fsm.useDsoSearch(tenantId, {
    limit: -1,
    status: "ACTIVE",
  });
  console.log("ffff",formData)

  const [vehicleMenu, setVehicleMenu] = useState([]);
  const [noOfTrips, setNoOfTrips] = useState(formData?.tripData?.noOfTrips || '');
  const [distancefromroad, setDistanceFromRoad] = useState(formData?.tripData?.distancefromroad||'');
  const [roadWidth, setRoadWidth] = useState(formData?.tripData?.roadWidth||'');

  useEffect(() => {
    if (dsoData && vehicleData) {
      const allVehicles = dsoData.reduce((acc, curr) => {
        return curr.vehicles && curr.vehicles.length ? acc.concat(curr.vehicles) : acc;
      }, []);

      const cpacityMenu = Array.from(new Set(allVehicles.map((a) => a.capacity))).map((capacity) => allVehicles.find((a) => a.capacity === capacity));

      setVehicleMenu(cpacityMenu);
    }
  }, [dsoData, vehicleData]);

  const inputs = [
    {
      label: "ES_NEW_APPLICATION_PAYMENT_NO_OF_TRIP",
      type: "text",
      name: "noOfTrips",
      error: t("ES_NEW_APPLICATION_NO_OF_TRIPS_INVALID"),
      validation: {
        isRequired: true,
        pattern: `^[1-9]+`,
        min: "1",
        title: t("ES_NEW_APPLICATION_NO_OF_TRIPS_INVALID"),
      },
      default: noOfTrips,
      disable: false,
      isMandatory: true,
    },
    {
      label:"ES_NEW_APPLICATION_DISTANCE_FROM_ROAD",
      type: "text",
      name: "distancefromroad",
      default: formData?.tripData?.distancefromroad,
      isMandatory: true,
    },
    {
      label: "ES_NEW_APPLICATION_ROAD_WIDTH",
      type: "text",
      name: "roadWidth",
      default: formData?.tripData?.roadWidth,
      isMandatory: true,
    }
  ];

  function setTripNum(value) {
    onSelect(config.key, { ...formData[config.key], noOfTrips: value });
  }

  function selectVehicle(value) {
    setVehicle({ label: value.capacity });
    onSelect(config.key, { ...formData[config.key], vehicleType: value });
  }
  //console.log(formdata)
  function setValue(value, input) {
    if (input === 'noOfTrips' || input === 'distancefromroad' || input === 'roadWidth') {
      value = value === '' ? '' : value;
    }
    if (input === 'noOfTrips') {
      setNoOfTrips(value);
      onSelect(config.key, { ...formData[config.key], noOfTrips: value });
    } 
    else if(input==="distancefromroad"){
      setDistanceFromRoad(value);
      onSelect(config.key, { ...formData[config.key], distancefromroad: value });
    }
    else if(input==="roadWidth"){
      setRoadWidth(value);
      onSelect(config.key, { ...formData[config.key], roadWidth: value });
    }else {
      value && input && onSelect(config.key, { ...formData[config.key], [input]: value });
    }
  }

  useEffect(() => {
    (async () => {
      if (formData?.tripData?.vehicleType !== vehicle) {
        setVehicle({ label: formData?.tripData?.vehicleType?.capacity });
      }

      if (
        formData?.address?.propertyLocation?.code === "FROM_GRAM_PANCHAYAT" &&
        formData.tripData.noOfTrips &&
        formData.tripData.amountPerTrip
      ) {
        setValue({
          amount: formData.tripData.amountPerTrip * formData.tripData.noOfTrips,
        });
      } else if (
        formData?.propertyType &&
        formData?.subtype &&
        formData?.address &&
        formData?.tripData?.vehicleType?.capacity &&
        formData?.address?.propertyLocation?.code === "WITHIN_ULB_LIMITS"
      ) {
        const capacity = formData?.tripData?.vehicleType.capacity;
        const { slum: slumDetails } = formData.address;
        const slum = slumDetails ? "YES" : "NO";
        const billingDetails = await Digit.FSMService.billingSlabSearch(tenantId, {
          propertyType: formData?.subtype,
          capacity,
          slum,
        });

        const billSlab = billingDetails?.billingSlab?.length && billingDetails?.billingSlab[0];
        if (billSlab?.price || billSlab?.price === 0) {
          // setValue({
          //   amountPerTrip: billSlab.price,
          //   amount: billSlab.price * formData.tripData.noOfTrips,
          // });
          // onSelect(config.key, { ...formData[config.key], amount: amount, amountPerTrip: billSlab.price });
          setValue(billSlab.price,"amountPerTrip");
          setValue(billSlab.price * formData.tripData.noOfTrips,"amount");
          setError(false);
        } else {
          setValue({
            amountPerTrip: "",
            amount: "",
          });
          setError(true);
        }
      }
    })();
  }, [formData?.propertyType, formData?.subtype, formData?.address, formData?.tripData?.vehicleType?.capacity, formData?.tripData?.noOfTrips, formData?.address?.propertyLocation?.code]);

  // console.log(formData,"formData 1111111111")
  return isVehicleMenuLoading && isDsoLoading ? (
    <Loader />
  ) : (
    <div>
      <LabelFieldPair>
        <CardLabel className="card-label-smaller">{t("ES_NEW_APPLICATION_LOCATION_VEHICLE_REQUESTED") + " * "}</CardLabel>
        <Dropdown
          className="form-field"
          style={styles}
          isMandatory
          option={vehicleMenu?.map((vehicle) => ({ ...vehicle, label: vehicle.capacity })).sort((a, b) => a.capacity - b.capacity)}
          optionKey="label"
          id="vehicle"
          selected={vehicle}
          select={selectVehicle}
          t={t}
          disable={editScreen && applicationData?.applicationStatus != "CREATED" ? true : false}
        />
      </LabelFieldPair>
      {inputs?.map((input, index) => (
        <LabelFieldPair key={index}>
          <CardLabel className="card-label-smaller">
            {t(input.label)}
            {input.isMandatory ? " * " : null}
          </CardLabel>
          <div className="field">
            <TextInput
              type={input.type}
              style={{ ...styles, ...FSMTextFieldStyle }}
              onChange={(e) => setValue(e.target.value, input.name)}
              key={input.name}
              value={input.name === "noOfTrips" ? noOfTrips : input.name ==="distancefromroad" ? distancefromroad : input.name === "roadWidth" ? roadWidth : formData[config.key]?.[input.name] || ''}
              {...input.validation}
              disable={input.disable}
            />
          </div>
        </LabelFieldPair>
      ))}
      {billError ? <CardLabelError style={{ width: "100%", textAlign: "center" }}>{t("ES_APPLICATION_BILL_SLAB_ERROR")}</CardLabelError> : null}
    </div>
  );
};

export default SelectTrips;
