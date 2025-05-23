package org.egov.dx.web.models;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RequestInfoWrapper {
	
	@JsonProperty("Transaction")
	private Transaction transaction;

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
}
