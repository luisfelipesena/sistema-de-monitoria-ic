#!/usr/bin/env python3
"""
Generate ERD diagram for Sistema de Monitoria-IC.
Creates a vertical layout suitable for PDF pages.
Based on src/server/db/schema.ts
"""

from graphviz import Digraph


def create_erd():
    """Create ERD with vertical layout matching current style."""

    # Create digraph with top-to-bottom layout
    dot = Digraph("ERD", format="png")
    dot.attr(
        rankdir="TB",  # Top to Bottom
        splines="ortho",
        nodesep="0.5",
        ranksep="0.8",
        fontname="Helvetica",
        bgcolor="white",
        dpi="150",
    )

    # Node styling (matching current purple/lilac theme)
    dot.attr("node", shape="none", fontname="Helvetica", fontsize="10")

    # Edge styling
    dot.attr(
        "edge", color="#9CA3AF", arrowhead="none", fontname="Helvetica", fontsize="8"
    )

    # Color scheme matching current ERD
    header_color = "#DDD6FE"  # Light purple for header
    body_color = "#F5F3FF"  # Very light purple for body
    pk_color = "#A78BFA"  # Purple badge for PK
    fk_color = "#C4B5FD"  # Lighter purple badge for FK
    border_color = "#C4B5FD"  # Border color

    def make_table(name, columns):
        """Generate HTML-like table for graphviz node."""
        rows = []
        for col_name, col_type, badges in columns:
            badge_html = ""
            for badge in badges:
                if badge == "PK":
                    badge_html += f'<TD BGCOLOR="{pk_color}" WIDTH="20"><FONT POINT-SIZE="8" COLOR="white">PK</FONT></TD>'
                elif badge == "FK":
                    badge_html += f'<TD BGCOLOR="{fk_color}" WIDTH="20"><FONT POINT-SIZE="8" COLOR="white">FK</FONT></TD>'

            if not badge_html:
                badge_html = '<TD WIDTH="20"></TD>'

            rows.append(
                f"""
            <TR>
                <TD ALIGN="LEFT" BGCOLOR="{body_color}">{col_name}</TD>
                <TD ALIGN="LEFT" BGCOLOR="{body_color}"><FONT COLOR="#6B7280">{col_type}</FONT></TD>
                {badge_html}
            </TR>"""
            )

        return f"""<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" BGCOLOR="{body_color}" COLOR="{border_color}">
            <TR>
                <TD COLSPAN="3" BGCOLOR="{header_color}"><B>{name}</B></TD>
            </TR>
            {''.join(rows)}
        </TABLE>>"""

    # Define tables with their columns (simplified for readability)
    # Format: (column_name, type, [badges])

    tables = {
        "user": [
            ("id", "int", ["PK"]),
            ("username", "text", []),
            ("email", "text", []),
            ("role", "enum", []),
        ],
        "professor": [
            ("id", "int", ["PK"]),
            ("user_id", "int", ["FK"]),
            ("departamento_id", "int", ["FK"]),
            ("nome_completo", "varchar", []),
        ],
        "aluno": [
            ("id", "int", ["PK"]),
            ("user_id", "int", ["FK"]),
            ("matricula", "varchar", []),
            ("CR", "real", []),
        ],
        "departamento": [
            ("id", "int", ["PK"]),
            ("nome", "varchar", []),
            ("sigla", "varchar", []),
        ],
        "disciplina": [
            ("id", "int", ["PK"]),
            ("codigo", "varchar", []),
            ("nome", "varchar", []),
            ("departamento_id", "int", ["FK"]),
        ],
        "projeto": [
            ("id", "int", ["PK"]),
            ("departamento_id", "int", ["FK"]),
            ("professor_responsavel_id", "int", ["FK"]),
            ("ano", "int", []),
            ("semestre", "enum", []),
            ("status", "enum", []),
            ("edital_interno_id", "int", ["FK"]),
        ],
        "projeto_disciplina": [
            ("id", "int", ["PK"]),
            ("projeto_id", "int", ["FK"]),
            ("disciplina_id", "int", ["FK"]),
        ],
        "projeto_template": [
            ("id", "int", ["PK"]),
            ("disciplina_id", "int", ["FK"]),
            ("titulo_default", "varchar", []),
        ],
        "importacao_planejamento": [
            ("id", "int", ["PK"]),
            ("file_id", "text", []),
            ("ano", "int", []),
            ("semestre", "enum", []),
            ("importado_por_user_id", "int", ["FK"]),
        ],
        "periodo_inscricao": [
            ("id", "int", ["PK"]),
            ("ano", "int", []),
            ("semestre", "enum", []),
            ("data_inicio", "date", []),
            ("data_fim", "date", []),
        ],
        "edital": [
            ("id", "int", ["PK"]),
            ("periodo_inscricao_id", "int", ["FK"]),
            ("numero_edital", "varchar", []),
            ("tipo", "enum", []),
        ],
        "inscricao": [
            ("id", "int", ["PK"]),
            ("periodo_inscricao_id", "int", ["FK"]),
            ("projeto_id", "int", ["FK"]),
            ("aluno_id", "int", ["FK"]),
            ("status", "enum", []),
        ],
        "vaga": [
            ("id", "int", ["PK"]),
            ("inscricao_id", "int", ["FK"]),
            ("aluno_id", "int", ["FK"]),
            ("projeto_id", "int", ["FK"]),
            ("tipo", "enum", []),
        ],
    }

    # Create nodes
    for table_name, columns in tables.items():
        dot.node(table_name, make_table(table_name, columns))

    # Enforce vertical layout with invisible edges (no clusters to avoid graphviz bug)
    dot.edge("user", "professor", style="invis")
    dot.edge("professor", "aluno", style="invis")

    dot.edge("departamento", "disciplina", style="invis")
    dot.edge("disciplina", "projeto", style="invis")
    dot.edge("projeto", "projeto_template", style="invis")
    dot.edge("projeto_template", "projeto_disciplina", style="invis")
    dot.edge("projeto_disciplina", "importacao_planejamento", style="invis")

    dot.edge("periodo_inscricao", "edital", style="invis")
    dot.edge("edital", "inscricao", style="invis")
    dot.edge("inscricao", "vaga", style="invis")

    # Visible relationships
    relationships = [
        ("professor", "user", ""),
        ("aluno", "user", ""),
        ("professor", "departamento", ""),
        ("disciplina", "departamento", ""),
        ("projeto", "departamento", ""),
        ("projeto", "professor", ""),
        ("projeto", "edital", ""),
        ("projeto_disciplina", "projeto", ""),
        ("projeto_disciplina", "disciplina", ""),
        ("projeto_template", "disciplina", ""),
        ("importacao_planejamento", "user", ""),
        ("edital", "periodo_inscricao", ""),
        ("inscricao", "periodo_inscricao", ""),
        ("inscricao", "projeto", ""),
        ("inscricao", "aluno", ""),
        ("vaga", "inscricao", ""),
        ("vaga", "aluno", ""),
        ("vaga", "projeto", ""),
    ]

    for source, target, label in relationships:
        dot.edge(source, target, label=label, constraint="false")

    return dot


def main():
    """Generate ERD and save to images folder."""
    import os
    from pathlib import Path

    script_dir = Path(__file__).parent
    output_dir = script_dir / "images" / "monitoria"
    output_file = output_dir / "data-model-erd"

    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    print("Generating ERD diagram...")
    print(f"Output: {output_file}.png")

    # Generate diagram
    dot = create_erd()

    # Add title
    dot.attr(
        label="Modelo de dados - Sistema de Monitoria-IC\nDiagrama ERD (PK/FK) do núcleo do domínio (alinhado ao schema atual)."
    )
    dot.attr(labelloc="t")
    dot.attr(fontsize="14")

    # Render to file
    dot.render(str(output_file), cleanup=True)

    print("Done!")

    # Show file size
    png_file = output_dir / "data-model-erd.png"
    if png_file.exists():
        size = png_file.stat().st_size
        print(f"File size: {size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
