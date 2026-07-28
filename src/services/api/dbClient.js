import { supabase } from "@/config/supabase";
import { executeQuery } from "./apiHelper";

class DatabaseClient {
  constructor() {
    this.primaryClient = supabase;
    // Prepared for future read-replica configuration
    // this.replicaClient = createClient(REPLICA_URL, ANON_KEY);
    this.replicaClient = supabase; 
  }

  /**
   * Execute read operations.
   * Can be routed to a read-replica in production to offload primary DB.
   */
  async read(queryFn) {
    return executeQuery(() => queryFn(this.replicaClient));
  }

  /**
   * Execute write/modification operations (insert, update, delete).
   * Must always be routed to the primary database instance.
   */
  async write(queryFn) {
    return executeQuery(() => queryFn(this.primaryClient));
  }
}

export const db = new DatabaseClient();
export default db;
