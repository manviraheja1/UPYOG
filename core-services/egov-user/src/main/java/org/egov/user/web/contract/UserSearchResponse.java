package org.egov.user.web.contract;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.user.domain.model.User;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class UserSearchResponse {
    @JsonProperty("responseInfo")
    ResponseInfo responseInfo;

    @JsonProperty("user")
    List<UserSearchResponseContent> userSearchResponseContent;

}
