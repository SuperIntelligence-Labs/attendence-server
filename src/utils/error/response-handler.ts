import {Result} from "neverthrow";
import {AppError} from "./errors";
import {error, success} from "./response.ts";
import logger from "../logger.ts";
import {mapErrorToStatus} from "./error-mapper.ts";

export function handleResult<T>(result: Result<T, AppError>): Response {
    return result.match(
        (data) => {
            return new Response(
                JSON.stringify(success("Request successful", data)),
                {
                    status: 200,
                    headers: {"Content-Type": "application/json"},
                }
            );
        },
        (err) => {
            logger.error(`[${err.identifier}] ${err.message}`);
            const status = mapErrorToStatus(err);
            return new Response(
                JSON.stringify(error(err.message, status, err.identifier)),
                {
                    status,
                    headers: {"Content-Type": "application/json"},
                }
            );
        }
    );
}
