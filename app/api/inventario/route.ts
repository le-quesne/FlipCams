import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/inventario
 * Devuelve todos los items del inventario ordenados por fecha de ingreso
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("inventario")
      .select("*")
      .order("fecha_ingreso", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error("GET /api/inventario error:", error);
    return NextResponse.json(
      { error: error.message || "Error al cargar inventario" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventario
 * Crea un nuevo item en el inventario
 * Body: { titulo, marca?, modelo?, estado, costo, precio_venta?, notas? }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { titulo, marca, modelo, estado, costo, precio_venta, notas } = body;

    if (!titulo || !estado || costo == null) {
      return NextResponse.json(
        { error: "titulo, estado y costo son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("inventario")
      .insert([
        {
          titulo,
          marca: marca || null,
          modelo: modelo || null,
          estado,
          costo: Number(costo),
          precio_venta: precio_venta ? Number(precio_venta) : null,
          notas: notas || null,
          creado_por: user.id,
          actualizado_por: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inventario error:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear item" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventario
 * Actualiza un item existente
 * Body: { id, titulo?, marca?, modelo?, estado?, costo?, precio_venta?, notas?, fecha_venta? }
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, titulo, marca, modelo, estado, costo, precio_venta, notas, fecha_venta } = body;

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const updates: any = { actualizado_por: user.id };
    if (titulo !== undefined) updates.titulo = titulo;
    if (marca !== undefined) updates.marca = marca || null;
    if (modelo !== undefined) updates.modelo = modelo || null;
    if (estado !== undefined) updates.estado = estado;
    if (costo !== undefined) updates.costo = Number(costo);
    if (precio_venta !== undefined) updates.precio_venta = precio_venta ? Number(precio_venta) : null;
    if (notas !== undefined) updates.notas = notas || null;
    if (fecha_venta !== undefined) updates.fecha_venta = fecha_venta || null;

    const { data, error } = await supabase
      .from("inventario")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("PUT /api/inventario error:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inventario
 * Elimina un item del inventario
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const { error } = await supabase.from("inventario").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/inventario error:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar item" },
      { status: 500 }
    );
  }
}
